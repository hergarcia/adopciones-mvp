import type { Pet, Publisher } from './types'

// La revisión de quien administra (historia #59, US4).

/** Nueva, o una revisada que su publicador volvió a editar (FR-022). */
export const PET_REVIEW_KINDS = ['new', 'edited'] as const
export type PetReviewKind = (typeof PET_REVIEW_KINDS)[number]

/** Una publicación que espera a quien administra: todo lo del animal, sin el contacto (FR-024). */
export type PetInReview = Omit<Pet, 'ageBase' | 'publishedOn' | 'requiredLevel'> & {
  code: string
  pendingKind: PetReviewKind
  /** Tal como lo devolvió la base: vuelve igual al resolver, para saber si cambió (research R8). */
  pendingSince: string
  isOwn: boolean
  /** Sin nivel 1, `level` es null: la cola lo dice en palabras. */
  publisher: Publisher
  /** Para el enlace a la ficha de quien publica (historia #73). */
  publisherPublicId: string
}

export type PetReviewQueue = {
  items: PetInReview[]
  /** Las que esperan a quien mira: sin las propias. */
  waiting: number
  signedAt: string
}
