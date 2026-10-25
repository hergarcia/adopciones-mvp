import { EMPTY_PET_FORM } from '@/lib/pets/types'
import { YOUNG_TO_START } from './rules'
import type { LitterFormValues } from './types'

// La camada nueva (FR-007, US1-AS2): la zona del perfil, la convivencia en «no se sabe», urgente en
// «no», teléfono verificado y dos crías en blanco, «Cría 1» y «Cría 2».
export function emptyLitterForm(
  zone: { department: string; locality: string },
  named: (number: number) => string,
): LitterFormValues {
  const { sex: _sex, ...common } = EMPTY_PET_FORM
  return {
    ...common,
    ...zone,
    deliversFrom: '',
    young: Array.from({ length: YOUNG_TO_START }, (_, index) => ({
      key: crypto.randomUUID(),
      name: named(index + 1),
      sex: '',
      description: '',
    })),
  }
}
