import type { Age, StoredAge } from '@/lib/pets/age'
import type { Sex, Species } from '@/lib/pets/options'
import type { PetFormValues, PetPhotoData, PublicPet, Takedown, Zone } from '@/lib/pets/types'

/**
 * Lo propio de una cría en el formulario. `key` es su intento: un reintento no la repite (R6). Al
 * editar, la que ya estaba publicada trae su `id`.
 */
export type YoungFormValues = {
  key: string
  id?: string
  name: string
  sex: string
  description: string
}

/** El formulario de la camada, en cadenas y claves: también es lo que guarda lo escrito. */
export type LitterFormValues = Omit<PetFormValues, 'sex'> & {
  /** `AAAA-MM-DD`, o vacío sin fecha. */
  deliversFrom: string
  young: YoungFormValues[]
}

/** El estado de la camada, calculado con el de sus crías (historia #206, research R1). */
export const LITTER_STATES = ['available', 'paused', 'expired', 'adopted', 'taken_down'] as const
export type LitterState = (typeof LITTER_STATES)[number]

/** El estado propio de una cría; pausada es el de su camada, no el suyo (research R2). */
export const YOUNG_STATES = ['available', 'in_process', 'adopted'] as const
export type YoungState = (typeof YOUNG_STATES)[number]

/** Una cría como la ve su dueña en «Mis animales». */
export type LitterYoung = { id: string; code: string; name: string; sex: Sex }

/** Una camada en «Mis animales». */
export type MyLitter = {
  id: string
  code: string
  name: string
  species: Species
  zone: Zone
  isUrgent: boolean
  publishedAt: Date
  cover: PetPhotoData
  young: LitterYoung[]
  /** El motivo de una camada dada de baja, que su dueña lee en «Mis animales» (FR-044). */
  takedown: Takedown | null
}

/** Una cría en la ficha de su camada. Sin fotos propias, `photos` trae las de la camada (FR-028). */
export type PublicYoung = {
  code: string
  name: string
  sex: Sex
  description: string | null
  photos: PetPhotoData[]
  /** De quien mira: su solicitud activa por esta cría, y si lo rechazaron por ella. */
  myActiveId: string | null
  myRejected: boolean
}

/** La ficha de la camada (FR-027). Oculta y ajena, solo se sabe eso. */
export type PublicLitter = Omit<
  PublicPet,
  'sex' | 'visibility' | 'state' | 'takedown' | 'publishedOn'
> & {
  visibility: 'listed' | 'hidden'
  takedown: Takedown | null
  publishedOn: string
  requiredLevel: 1 | 2
  /** `AAAA-MM-DD`, o null sin fecha. */
  deliversFrom: string | null
  young: PublicYoung[]
  availableCount: number
}

export type PublicLitterResult =
  | PublicLitter
  | { visibility: 'hidden'; isOwner: false }
  /** Quien mira bloqueó a quien la publicó (#13): nada de la camada, solo a quién desbloquear. */
  | { visibility: 'blocked'; isOwner: false; publisherPublicId: string }

/** Una camada propia abierta para editar: lo guardado en el formulario y sus fotos por grupo. */
export type LitterForEdit = {
  id: string
  code: string
  name: string
  values: LitterFormValues
  /** Las fotos de la camada y, por la `key` de cada cría, las suyas, en orden. */
  photos: { litter: PetPhotoData[]; young: Record<string, PetPhotoData[]> }
  ageBase: StoredAge
  /** La edad que se muestra hoy, la misma que trae `values`. */
  age: Age
  /** `AAAA-MM-DD`, o null sin fecha: la guardada, que no traba aunque haya pasado (FR-013). */
  deliversFrom: string | null
  isTakenDown: boolean
}

/** Solo al editar: la camada, sus crías al abrir, la edad que se mostró y la fecha guardada. */
export type LitterEditing = {
  litterId: string
  youngIds: string[]
  ageBase: StoredAge
  ageShown: Age
  /** `AAAA-MM-DD`, o null: la guardada no traba aunque haya pasado (FR-013). */
  deliversFrom: string | null
}
