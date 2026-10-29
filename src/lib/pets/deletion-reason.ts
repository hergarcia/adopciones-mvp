import type { LitterState } from '@/lib/litters/types'
import type { PetState } from './types'

// «¿Por qué lo borrás?» (historia #263). La misma lista vive en el `check` de
// `public.deletion_reasons`, y la misma regla de cuándo se pregunta en `delete_pet` y
// `delete_litter`: tests/db compara las dos (research R3).

/** En el orden de la historia, que es el de la pantalla y el de Encuestas. */
export const DELETION_REASONS = [
  'no_applications',
  'unconvincing_applications',
  'given_elsewhere',
  'not_for_adoption',
  'other',
] as const
export type DeletionReason = (typeof DELETION_REASONS)[number]

/** Lo que se cuenta de un borrado con pregunta: la opción, o que no eligió ninguna. */
export const DELETION_ANSWERS = [...DELETION_REASONS, 'unanswered'] as const
export type DeletionAnswer = (typeof DELETION_ANSWERS)[number]

/** Un animal o una camada, en el orden de las columnas de Encuestas. */
export const DELETION_KINDS = ['pet', 'litter'] as const
export type DeletionKind = (typeof DELETION_KINDS)[number]

// Adoptado y dado de baja quedan afuera: la publicación terminó, o la sacó quien administra.
const PET_ASKS: readonly PetState[] = ['available', 'in_process', 'paused', 'expired']

export function petAsksDeletionReason(state: PetState): boolean {
  return PET_ASKS.includes(state)
}

// Una camada es `adopted` cuando todas sus crías lo están (litterStateOf): cualquier otro estado
// que no sea la baja tiene al menos una cría sin hogar.
export function litterAsksDeletionReason(state: LitterState): boolean {
  return state !== 'adopted' && state !== 'taken_down'
}

/** Lo elegido en la confirmación; vacío, o algo que no es una opción, cuenta como sin contestar. */
export function deletionAnswerOf(selected: string): DeletionAnswer {
  return DELETION_REASONS.find((reason) => reason === selected) ?? 'unanswered'
}
