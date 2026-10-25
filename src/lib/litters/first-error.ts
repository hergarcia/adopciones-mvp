import {
  LITTER_FIELDS,
  YOUNG_FIELDS,
  type LitterErrors,
  type LitterField,
  type YoungField,
} from '@/lib/schemas/litter'
import type { YoungFormValues } from './types'

export type ErrorTarget =
  | { kind: 'field'; field: LitterField | 'photos' }
  | { kind: 'count' }
  | { kind: 'young'; key: string; field: YoungField }

const LAST: readonly LitterField[] = ['requiredLevel', 'deliversFrom']

// El primer error en el orden en que se lee el formulario: las fotos, lo común, las crías de
// arriba abajo y el pie. Ahí va el foco (FR-016 de la #53).
export function firstLitterError(
  errors: LitterErrors,
  young: readonly YoungFormValues[],
  photosMissing: boolean,
): ErrorTarget | null {
  if (photosMissing) return { kind: 'field', field: 'photos' }
  const common = LITTER_FIELDS.filter((field) => !LAST.includes(field))
  const field = common.find((one) => errors.fields[one] !== undefined)
  if (field !== undefined) return { kind: 'field', field }
  if (errors.count !== null) return { kind: 'count' }
  for (const one of young) {
    const own = YOUNG_FIELDS.find((candidate) => errors.young[one.key]?.[candidate] !== undefined)
    if (own !== undefined) return { kind: 'young', key: one.key, field: own }
  }
  const last = LAST.find((one) => errors.fields[one] !== undefined)
  return last === undefined ? null : { kind: 'field', field: last }
}
