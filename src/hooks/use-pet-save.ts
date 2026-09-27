'use client'

import { useState } from 'react'
import { uploadPetPhoto } from '@/actions/pet-photos'
import type { PetActionDetail } from '@/actions/pets'
import type { ActionResult } from '@/actions/result'
import { photoIdsToSend, photosToUpload } from '@/lib/pets/photo-list'
import { SAVE_TIMEOUT_MS } from '@/lib/pets/rules'
import { classifySaveOutcome, type SaveFailure } from '@/lib/pets/save-failure'
import type { PetPhotos, PetPhotoSlot } from './use-pet-photos'

export type SaveOutcome = { kind: 'ok' } | { kind: SaveFailure; detail?: PetActionDetail }
export type SaveProgress =
  { phase: 'uploading'; done: number; total: number } | { phase: 'sending' }

type Send = (photoIds: string[]) => Promise<ActionResult<unknown, PetActionDetail>>

async function call(
  action: () => Promise<ActionResult<unknown, PetActionDetail>>,
): Promise<SaveOutcome> {
  try {
    const result = await action()
    const kind = classifySaveOutcome({
      rejected: false,
      online: navigator.onLine,
      timedOut: false,
      result,
    })
    return kind === 'ok' ? { kind } : { kind, detail: result.ok ? undefined : result.detail }
  } catch {
    return {
      kind: classifySaveOutcome({ rejected: true, online: navigator.onLine, timedOut: false }),
    }
  }
}

function uploadForm(slot: Extract<PetPhotoSlot, { state: 'ready' }>, returnTo: string): FormData {
  const form = new FormData()
  form.set('photoId', slot.photoId)
  form.set('width', String(slot.prepared.width))
  form.set('height', String(slot.prepared.height))
  form.set('thumbhash', slot.prepared.thumbhash)
  form.set('returnTo', returnTo)
  for (const [size, file] of Object.entries(slot.prepared.files)) form.set(size, file)
  return form
}

// Publicar o guardar de punta a punta: sube las fotos que falten, de a una y contando, y después
// manda el formulario con los ids en orden. Si la base ya no acepta alguna foto en espera, las
// vuelve a subir con ids nuevos y reintenta una sola vez (research R1). Pasados 2 minutos deja de
// esperar y lo trata como que el sitio no respondió (FR-018); la regla vive en `save-failure.ts`.
export function usePetSave({ photos, returnTo }: { photos: PetPhotos; returnTo: string }) {
  const [progress, setProgress] = useState<SaveProgress | null>(null)

  async function attempt(send: Send, renew: boolean): Promise<SaveOutcome> {
    const pending = photosToUpload(photos.latest())
    for (const [index, slot] of pending.entries()) {
      setProgress({ phase: 'uploading', done: index, total: pending.length })
      // De a una y en orden: el progreso cuenta respuestas, y un reintento sube solo lo que falta.
      // oxlint-disable-next-line no-await-in-loop
      const uploaded = await call(() => uploadPetPhoto(uploadForm(slot, returnTo)))
      if (uploaded.kind !== 'ok') return uploaded
      photos.markUploaded(slot.key)
    }
    setProgress({ phase: 'sending' })
    const sent = await call(() => send(photoIdsToSend(photos.latest())))
    if (sent.kind === 'photos_invalid' && renew) {
      photos.renewIds()
      return attempt(send, false)
    }
    return sent
  }

  async function run(send: Send): Promise<SaveOutcome> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<SaveOutcome>((resolve) => {
      timer = setTimeout(() => {
        resolve({
          kind: classifySaveOutcome({ rejected: false, online: navigator.onLine, timedOut: true }),
        })
      }, SAVE_TIMEOUT_MS)
    })
    try {
      return await Promise.race([attempt(send, true), timeout])
    } finally {
      clearTimeout(timer)
      setProgress(null)
    }
  }

  return { progress, run }
}
