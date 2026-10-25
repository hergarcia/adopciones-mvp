'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  addPhotos,
  emptyPhotoList,
  makeCover,
  markReady,
  markUploaded,
  movePhoto,
  photoIdsToSend,
  rejectPhoto,
  removePhoto,
  withNewIds,
} from '@/lib/pets/photo-list'
import { MAX_PHOTOS } from '@/lib/pets/rules'
import {
  usePhotoPreparation,
  type PetPhotoList,
  type PetPhotoSlot,
  type SubmitPhotos,
} from './use-pet-photos'

/** Las fotos de la camada van en este grupo; las de cada cría, en el de su `key`. */
export const LITTER_PHOTOS = 'litter'

type Groups = Readonly<Record<string, PetPhotoList>>

const EMPTY = emptyPhotoList<never>()

function combined(groups: Groups): PetPhotoList {
  const lists = Object.values(groups)
  return {
    slots: lists.flatMap((list) => list.slots),
    rejections: lists.flatMap((list) => list.rejections),
    overflow: 0,
  }
}

function mapAll(groups: Groups, change: (list: PetPhotoList) => PetPhotoList): Groups {
  return Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, change(list)]))
}

// Las fotos de la camada y las de cada cría, cada grupo con sus 5 (FR-011). Publicar las sube todas
// juntas: `submit` las muestra como una sola lista a `usePetSubmit`, que espera las que se preparan y
// sube las que faltan, y cada grupo manda después sus ids en orden. Al editar arranca con las
// publicadas de cada grupo.
export function useLitterPhotos(initial: Readonly<Record<string, PetPhotoSlot[]>> = {}) {
  const [groups, setGroups] = useState<Groups>(() =>
    Object.fromEntries(Object.entries(initial).map(([key, slots]) => [key, emptyPhotoList(slots)])),
  )
  const latest = useRef(groups)

  const commit = useCallback((change: (current: Groups) => Groups) => {
    latest.current = change(latest.current)
    setGroups(latest.current)
  }, [])

  const inGroup = useCallback(
    (group: string, change: (list: PetPhotoList) => PetPhotoList) =>
      commit((current) => ({ ...current, [group]: change(current[group] ?? EMPTY) })),
    [commit],
  )

  const prepare = usePhotoPreparation(
    {
      ready: (key, ready) =>
        commit((current) => mapAll(current, (list) => markReady(list, key, ready))),
      failed: (key, fileName) =>
        commit((current) =>
          mapAll(current, (list) =>
            list.slots.some((slot) => slot.key === key)
              ? rejectPhoto(list, key, fileName, 'pets.errors.photo_failed')
              : list,
          ),
        ),
    },
    { keepPreviews: true },
  )

  const pick = useCallback(
    (group: string, files: File[]) => {
      const picked = files.map((file) => ({ key: crypto.randomUUID(), file }))
      inGroup(group, (list) => addPhotos(list, picked, MAX_PHOTOS))
      const entered = new Set((latest.current[group] ?? EMPTY).slots.map((slot) => slot.key))
      for (const { key, file } of picked) {
        if (entered.has(key)) void prepare(key, file)
      }
    },
    [inGroup, prepare],
  )

  const list = useMemo(() => combined(groups), [groups])
  const submit: SubmitPhotos = {
    list,
    latest: () => combined(latest.current),
    markUploaded: (key) => commit((current) => mapAll(current, (one) => markUploaded(one, key))),
    renewIds: () =>
      commit((current) => mapAll(current, (one) => withNewIds(one, () => crypto.randomUUID()))),
  }

  return {
    listOf: (group: string): PetPhotoList => groups[group] ?? EMPTY,
    /** Las fotos de un grupo como están ahora, para pasarlas al formulario de un animal. */
    slotsOf: (group: string): PetPhotoSlot[] => (latest.current[group] ?? EMPTY).slots,
    /** Los ids de un grupo en orden, leídos al mandar: después de subir, no del último render. */
    idsOf: (group: string): string[] => photoIdsToSend(latest.current[group] ?? EMPTY),
    pick,
    remove: (group: string, key: string) => inGroup(group, (one) => removePhoto(one, key)),
    move: (group: string, key: string, step: -1 | 1) =>
      inGroup(group, (one) => movePhoto(one, key, step)),
    makeCover: (group: string, key: string) => inGroup(group, (one) => makeCover(one, key)),
    /** Una cría quitada se lleva sus fotos. */
    drop: (group: string) =>
      commit((current) =>
        Object.fromEntries(Object.entries(current).filter(([key]) => key !== group)),
      ),
    submit,
  }
}

export type LitterPhotos = ReturnType<typeof useLitterPhotos>
