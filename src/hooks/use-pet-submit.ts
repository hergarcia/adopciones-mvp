'use client'

import { useEffect, useRef, useState } from 'react'
import type { PetActionDetail } from '@/actions/pets'
import type { ActionResult } from '@/actions/result'
import { preparingKeys, submitReadiness } from '@/lib/pets/photo-list'
import type { PetPhotos } from './use-pet-photos'
import { usePetSave, type SaveOutcome } from './use-pet-save'

type Options = {
  photos: PetPhotos
  returnTo: string
  onOutcome: (outcome: SaveOutcome | { kind: 'blocked' | 'empty' }) => void
}

type Send = (photoIds: string[]) => Promise<ActionResult<unknown, PetActionDetail>>

// La tirita ocupada de punta a punta: si hay fotos preparándose, espera a que terminen y recién
// entonces manda; si alguna de esas terminó rechazada, no manda nada y se libera (spec, Edge Cases
// «Fotos todavía preparándose»; research R19). Un segundo toque mientras tanto no hace nada.
export function usePetSubmit({ photos, returnTo, onOutcome }: Options) {
  const save = usePetSave({ photos, returnTo })
  const [busy, setBusy] = useState(false)
  const [queued, setQueued] = useState<{ send: Send; waitedFor: string[] } | null>(null)

  // El último render manda: la lista, el guardado y qué hacer con lo que responda.
  const current = useRef({ run: save.run, onOutcome })
  useEffect(() => {
    current.current = { run: save.run, onOutcome }
  })

  // Vuelve a decidir cada vez que cambia la lista mientras se espera.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    if (queued === null) return
    const readiness = submitReadiness(photos.list, queued.waitedFor)
    if (readiness === 'wait') return
    setQueued(null)
    if (readiness !== 'ready') {
      setBusy(false)
      current.current.onOutcome({ kind: readiness })
      return
    }
    void current.current.run(queued.send).then((outcome) => {
      setBusy(false)
      current.current.onOutcome(outcome)
    })
  }, [queued, photos.list])
  /* eslint-enable react/set-state-in-effect */

  function submit(action: Send) {
    if (busy) return
    setBusy(true)
    setQueued({ send: action, waitedFor: preparingKeys(photos.latest()) })
  }

  return { busy, progress: save.progress, submit }
}
