'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { thumbHashToDataURL } from 'thumbhash'
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
  type PhotoSlot,
} from '@/lib/pets/photo-list'
import { preparePhoto, type PreparedPhoto } from '@/lib/pets/photo-processing'

export type PetPhotoList = PhotoList<PreparedPhoto>
export type PetPhotoSlot = PhotoSlot<PreparedPhoto>

function placeholderOf(thumbhash: string): string {
  return thumbHashToDataURL(Uint8Array.from(atob(thumbhash), (char) => char.charCodeAt(0)))
}

// La lista de fotos en pantalla y su preparación en el navegador. La lista vive también en una
// ref: publicar la lee después de esperar subidas y preparados, y el estado de React de ese
// momento ya no es el de ahora.
export function usePetPhotos(initial: PetPhotoSlot[]) {
  const [list, setList] = useState<PetPhotoList>(() => emptyPhotoList(initial))
  const latest = useRef(list)
  const previews = useRef<string[]>([])

  const commit = useCallback((change: (current: PetPhotoList) => PetPhotoList) => {
    latest.current = change(latest.current)
    setList(latest.current)
  }, [])

  useEffect(
    () => () => {
      for (const url of previews.current) URL.revokeObjectURL(url)
    },
    [],
  )

  const prepare = useCallback(
    async (key: string, file: File) => {
      try {
        const prepared = await preparePhoto(file)
        const src = URL.createObjectURL(prepared.files.card)
        previews.current.push(src)
        const preview = {
          src,
          placeholder: placeholderOf(prepared.thumbhash),
          width: prepared.width,
          height: prepared.height,
        }
        commit((current) =>
          markReady(current, key, { photoId: crypto.randomUUID(), preview, prepared }),
        )
      } catch {
        commit((current) =>
          current.slots.some((slot) => slot.key === key)
            ? rejectPhoto(current, key, file.name, 'pets.errors.photo_failed')
            : current,
        )
      }
    },
    [commit],
  )

  const pick = useCallback(
    (files: File[]) => {
      const picked = files.map((file) => ({ key: crypto.randomUUID(), file }))
      commit((current) => addPhotos(current, picked))
      const entered = new Set(latest.current.slots.map((slot) => slot.key))
      for (const { key, file } of picked) {
        if (entered.has(key)) void prepare(key, file)
      }
    },
    [commit, prepare],
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
