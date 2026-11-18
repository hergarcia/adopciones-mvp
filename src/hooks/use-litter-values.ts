'use client'

import type { LitterFormValues } from '@/lib/litters/types'
import { nextYoungName } from '@/lib/litters/young-names'
import type { PetFormValues, PetTraitKey } from '@/lib/pets/types'
import type { YoungField } from '@/lib/schemas/litter'
import type { useLitterDraft } from './use-litter-draft'

type Options = {
  draft: ReturnType<typeof useLitterDraft>
  /** «Cría {number}», ya traducido. */
  defaultName: string
  /** Una cría quitada se lleva sus fotos. */
  onYoungRemoved: (key: string) => void
  /** Un campo cambiado se lleva su aviso, de la camada o de una cría (#296). */
  onEdited: (key: string) => void
  onYoungEdited: (key: string, field: YoungField) => void
}

// Los cambios del formulario de la camada: lo común, cada cría, agregar y quitar. Cada uno marca el
// comienzo de la carga, como en un animal (FR-028 de la #53).
export function useLitterValues({
  draft,
  defaultName,
  onYoungRemoved,
  onEdited,
  onYoungEdited,
}: Options) {
  function change<K extends keyof LitterFormValues>(key: K, value: LitterFormValues[K]) {
    draft.markStarted()
    draft.setValues((current) => ({ ...current, [key]: value }))
    onEdited(key)
  }

  return {
    change,
    changeTrait: <K extends PetTraitKey>(key: K, value: PetFormValues[K]) => {
      draft.markStarted()
      draft.setValues((current) => ({ ...current, [key]: value }))
      onEdited(key)
    },
    changeYoung: (key: string, field: YoungField, value: string) => {
      draft.markStarted()
      draft.setValues((current) => ({
        ...current,
        young: current.young.map((one) => (one.key === key ? { ...one, [field]: value } : one)),
      }))
      onYoungEdited(key, field)
    },
    // El primer «Cría N» libre (FR-007).
    addYoung: () => {
      draft.markStarted()
      draft.setValues((current) => {
        const name = nextYoungName(
          current.young.map((one) => one.name),
          (number) => defaultName.replace('{number}', String(number)),
        )
        const added = { key: crypto.randomUUID(), name, sex: '', description: '' }
        return { ...current, young: [...current.young, added] }
      })
    },
    removeYoung: (key: string) => {
      change(
        'young',
        draft.values.young.filter((one) => one.key !== key),
      )
      onYoungRemoved(key)
    },
  }
}
