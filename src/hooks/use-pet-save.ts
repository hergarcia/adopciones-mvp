'use client'

import { useState } from 'react'
import { uploadPetPhoto } from '@/actions/pet-photos'
import type { PetActionDetail } from '@/actions/pets'
import type { ActionResult } from '@/actions/result'
import type { SaveOutcome as Outcome, SaveProgress } from '@/lib/pets/save-run'
import { afterOpenModule } from './use-after-open'
import type { SubmitPhotos } from './use-pet-photos'

export type { SaveProgress }
export type SaveOutcome = Outcome<PetActionDetail>

type Send = (photoIds: string[]) => Promise<ActionResult<unknown, PetActionDetail>>

// Subir y mandar llega después de abrir; el «Publicar» que llega antes lo espera (historia #304).
const loadSave = afterOpenModule(() => import('@/lib/pets/save-run'))

// El guardado de punta a punta vive en `lib/pets/save-run.ts`; acá queda lo que se ve mientras
// tanto. Si ni siquiera llegó lo que guarda, es la red: lo mismo que dice el formulario cuando no
// llegan sus reglas.
export function usePetSave({ photos, returnTo }: { photos: SubmitPhotos; returnTo: string }) {
  const [progress, setProgress] = useState<SaveProgress | null>(null)

  async function run(send: Send): Promise<SaveOutcome> {
    try {
      const save = await loadSave().catch(() => null)
      if (save === null) return { kind: 'offline' }
      return await save.runPetSave({
        photos,
        returnTo,
        send,
        upload: uploadPetPhoto,
        onProgress: setProgress,
      })
    } finally {
      setProgress(null)
    }
  }

  return { progress, run }
}
