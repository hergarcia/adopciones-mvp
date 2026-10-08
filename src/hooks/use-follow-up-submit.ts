'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { answerFollowUp, uploadFollowUpPhoto } from '@/actions/follow-ups'
import type { ActionResult } from '@/actions/result'
import { myApplicationPath } from '@/lib/applications/paths'
import { signInWithNext } from '@/lib/auth/next-destination'
import { followUpSentPath } from '@/lib/follow-ups/paths'
import { raceDeadline } from '@/lib/forms/action-deadline'
import {
  photoIdsToSend,
  photosToUpload,
  preparingKeys,
  submitReadiness,
} from '@/lib/pets/photo-list'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import type { PetPhotos, PetPhotoSlot } from './use-pet-photos'
import { failureOf, type PetStatusFailure } from './use-pet-status'

/** Por qué no se mandó: la red (con lo cargado en pantalla), o una clave de `follow_ups.errors`. */
export type FollowUpProblem = { kind: PetStatusFailure } | { kind: 'refused'; error: string }
export type FollowUpFailure = FollowUpProblem & { attempt: number }

const SESSION = 'follow_ups.errors.session'
const CLOSED = 'follow_ups.errors.closed'
const INVALID = 'follow_ups.errors.invalid'
const PHOTOS_REQUIRED = 'follow_ups.errors.photos_required'

type Step = { ok: true } | { ok: false; kind: PetStatusFailure } | { ok: false; error: string }

async function call(pending: Promise<ActionResult<unknown>>): Promise<Step> {
  const outcome = navigator.onLine
    ? await raceDeadline(pending, SAVE_DEADLINE_MS)
    : ({ kind: 'threw' } as const)
  if (outcome.kind !== 'result') return { ok: false, kind: failureOf(outcome.kind) }
  return outcome.result.ok ? { ok: true } : { ok: false, error: outcome.result.error }
}

function uploadForm(applicationId: string, slot: Extract<PetPhotoSlot, { state: 'ready' }>) {
  const form = new FormData()
  form.set('applicationId', applicationId)
  form.set('photoId', slot.photoId)
  form.set('width', String(slot.prepared.width))
  form.set('height', String(slot.prepared.height))
  form.set('thumbhash', slot.prepared.thumbhash)
  for (const [size, file] of Object.entries(slot.prepared.files)) form.set(size, file)
  return form
}

// El texto no pasa de 500 porque el campo no deja escribir más; el resto lo mira la base con el
// candado y vuelve como clave de `follow_ups.errors`.
// «Mandar» de punta a punta (plan §Mi solicitud), con la forma de `usePetSave`: espera a las fotos
// que se preparan, sube de a una las que todavía no llegaron —un reintento manda solo lo que falta— y
// después la respuesta. Si las fotos en espera ya no están (pasaron 24 horas), vuelven a subir con ids
// nuevos una sola vez. Lo que no llegó deja fotos y texto en pantalla (FR-014); el pedido que se
// cerró mientras tanto lo dice y la pantalla vuelve a cargar.
export function useFollowUpSubmit({
  applicationId,
  photos,
}: {
  applicationId: string
  photos: PetPhotos
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<FollowUpFailure | null>(null)
  const [queued, setQueued] = useState<{ text: string; waitedFor: string[] } | null>(null)

  function fail(next: FollowUpProblem) {
    setFailure((previous) => ({ ...next, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function attempt(text: string, renew: boolean): Promise<Step> {
    for (const slot of photosToUpload(photos.latest())) {
      // De a una y en orden: un reintento sube solo lo que falta.
      // oxlint-disable-next-line no-await-in-loop
      const uploaded = await call(uploadFollowUpPhoto(uploadForm(applicationId, slot)))
      if (!uploaded.ok) return uploaded
      photos.markUploaded(slot.key)
    }
    const photoIds = photoIdsToSend(photos.latest())
    const sent = await call(answerFollowUp({ applicationId, photoIds, text }))
    if (renew && !sent.ok && 'error' in sent && sent.error === INVALID) {
      photos.renewIds()
      return attempt(text, false)
    }
    return sent
  }

  async function run(text: string) {
    const step = await attempt(text, true)
    setBusy(false)
    if (step.ok) {
      setFailure(null)
      router.replace(followUpSentPath(applicationId))
      return
    }
    if ('kind' in step) {
      fail({ kind: step.kind })
      return
    }
    if (step.error === SESSION) {
      router.push(signInWithNext(myApplicationPath(applicationId)))
      return
    }
    fail({ kind: 'refused', error: step.error })
    if (step.error === CLOSED) router.refresh()
  }

  const current = useRef(run)
  useEffect(() => {
    current.current = run
  })

  // Vuelve a decidir cada vez que cambia la lista mientras se espera a las que se preparan.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (queued === null) return
    const readiness = submitReadiness(photos.list, queued.waitedFor)
    if (readiness === 'wait') return
    setQueued(null)
    if (readiness !== 'ready') {
      setBusy(false)
      fail({ kind: 'refused', error: PHOTOS_REQUIRED })
      return
    }
    void current.current(queued.text)
  }, [queued, photos.list])
  /* eslint-enable react/set-state-in-effect */

  function submit(text: string) {
    if (busy) return
    const list = photos.latest()
    if (list.slots.length === 0) {
      fail({ kind: 'refused', error: PHOTOS_REQUIRED })
      return
    }
    setBusy(true)
    setQueued({ text, waitedFor: preparingKeys(list) })
  }

  return { busy, failure, submit }
}
