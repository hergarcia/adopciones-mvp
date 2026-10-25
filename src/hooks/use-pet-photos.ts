'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addPhotos,
  emptyPhotoList,
  makeCover,
  markReady,
  markUploaded,
  movePhoto,
  rejectPhoto,
  removePhoto,
  withNewIds,
  type PhotoList,
  type PhotoPreview,
  type PhotoSlot,
} from '@/lib/pets/photo-list'
import { thumbHashDataUrl } from '@/lib/images/thumbhash-data-url'
import { preparePhoto, type PreparedPhoto } from '@/lib/pets/photo-processing'
import { MAX_PHOTOS } from '@/lib/pets/rules'

export type PetPhotoList = PhotoList<PreparedPhoto>
export type PetPhotoSlot = PhotoSlot<PreparedPhoto>

// Prepara cada foto elegida en el navegador (3 WebP y ThumbHash) y avisa cuando quedó lista o no se
// pudo. Las vistas previas se sueltan al desmontar, salvo con `keepPreviews`: las de una camada
// pueden pasar al formulario de un animal (#205, FR-012) y se van con la página. La comparten la
// ficha y la camada.
export function usePhotoPreparation(
  on: {
    ready: (
      key: string,
      ready: { photoId: string; preview: PhotoPreview; prepared: PreparedPhoto },
    ) => void
    failed: (key: string, fileName: string) => void
  },
  { keepPreviews = false }: { keepPreviews?: boolean } = {},
) {
  const previews = useRef<string[]>([])
  const callbacks = useRef(on)
  useEffect(() => {
    callbacks.current = on
  })

  useEffect(
    () => () => {
      if (keepPreviews) return
      for (const url of previews.current) URL.revokeObjectURL(url)
    },
    [keepPreviews],
  )

  return useCallback(async (key: string, file: File) => {
    try {
      const prepared = await preparePhoto(file)
      const src = URL.createObjectURL(prepared.files.card)
      previews.current.push(src)
      const preview = {
        src,
        placeholder: thumbHashDataUrl(prepared.thumbhash),
        width: prepared.width,
        height: prepared.height,
      }
      callbacks.current.ready(key, { photoId: crypto.randomUUID(), preview, prepared })
    } catch {
      callbacks.current.failed(key, file.name)
    }
  }, [])
}

// La lista de fotos en pantalla y su preparación en el navegador. La lista vive también en una
// ref: publicar la lee después de esperar subidas y preparados, y el estado de React de ese
// momento ya no es el de ahora.
export function usePetPhotos(initial: PetPhotoSlot[], max = MAX_PHOTOS) {
  const [list, setList] = useState<PetPhotoList>(() => emptyPhotoList(initial))
  const latest = useRef(list)

  const commit = useCallback((change: (current: PetPhotoList) => PetPhotoList) => {
    latest.current = change(latest.current)
    setList(latest.current)
  }, [])

  const prepare = usePhotoPreparation({
    ready: (key, ready) => commit((current) => markReady(current, key, ready)),
    failed: (key, fileName) =>
      commit((current) =>
        current.slots.some((slot) => slot.key === key)
          ? rejectPhoto(current, key, fileName, 'pets.errors.photo_failed')
          : current,
      ),
  })

  const pick = useCallback(
    (files: File[]) => {
      const picked = files.map((file) => ({ key: crypto.randomUUID(), file }))
      commit((current) => addPhotos(current, picked, max))
      const entered = new Set(latest.current.slots.map((slot) => slot.key))
      for (const { key, file } of picked) {
        if (entered.has(key)) void prepare(key, file)
      }
    },
    [commit, max, prepare],
  )

  return {
    list,
    latest: () => latest.current,
    pick,
    remove: (key: string) => commit((current) => removePhoto(current, key)),
    move: (key: string, step: -1 | 1) => commit((current) => movePhoto(current, key, step)),
    makeCover: (key: string) => commit((current) => makeCover(current, key)),
    markUploaded: (key: string) => commit((current) => markUploaded(current, key)),
    renewIds: () => commit((current) => withNewIds(current, () => crypto.randomUUID())),
    reset: () => commit(() => emptyPhotoList(initial)),
  }
}

export type PetPhotos = ReturnType<typeof usePetPhotos>
/** Lo que necesita publicar: la lista, la última versión, y marcar o renovar lo subido. */
export type SubmitPhotos = Pick<PetPhotos, 'list' | 'latest' | 'markUploaded' | 'renewIds'>
