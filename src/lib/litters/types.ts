import type { Sex, Species } from '@/lib/pets/options'
import type { PetFormValues, PetPhotoData, PublicPet, Takedown, Zone } from '@/lib/pets/types'

/** Lo propio de una cría en el formulario. `key` es su intento: un reintento no la repite (R6). */
export type YoungFormValues = { key: string; name: string; sex: string; description: string }

/** El formulario de la camada, en cadenas y claves: también es lo que guarda lo escrito. */
export type LitterFormValues = Omit<PetFormValues, 'sex'> & {
  /** `AAAA-MM-DD`, o vacío sin fecha. */
  deliversFrom: string
  young: YoungFormValues[]
}

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
