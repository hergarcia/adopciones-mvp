import type { Sex } from './options'
import type { Pet, PetPhotoData, Publisher } from './types'

// La revisión de quien administra (historia #59, US4).

/** Nueva, o una revisada que su publicador volvió a editar (FR-022). */
export const PET_REVIEW_KINDS = ['new', 'edited'] as const
export type PetReviewKind = (typeof PET_REVIEW_KINDS)[number]

/** Lo que se revisa: un animal suelto o una camada entera, que es una sola entrada (#205, FR-043). */
export const REVIEW_SUBJECTS = ['pet', 'litter'] as const
export type ReviewSubject = (typeof REVIEW_SUBJECTS)[number]

/** A qué apunta una decisión: el id del animal o de la camada. */
export type ReviewTarget = { kind: ReviewSubject; id: string }

/** Una publicación que espera a quien administra: todo lo del animal, sin el contacto (FR-024). */
export type PetInReview = Omit<Pet, 'ageBase' | 'publishedOn' | 'requiredLevel'> & {
  kind: 'pet'
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

/** Una cría como la revisa quien administra: lo suyo y solo sus fotos propias. */
export type YoungInReview = {
  id: string
  name: string
  sex: Sex
  description: string | null
  photos: PetPhotoData[]
}

/** Una camada que espera: lo común, sus fotos y cada cría con lo suyo (FR-043). */
export type LitterInReview = Omit<PetInReview, 'kind' | 'sex' | 'state'> & {
  kind: 'litter'
  young: YoungInReview[]
}

export type ReviewItem = PetInReview | LitterInReview

export type PetReviewQueue = {
  items: ReviewItem[]
  /** Las que esperan a quien mira: sin las propias. */
  waiting: number
  signedAt: string
}
