import type { DepartmentCode } from '@/lib/zones/departments'
import type { Age, StoredAge } from './age'
import type { GoodWith, Sex, Size, Species, Vaccines } from './options'
import type { PhotoSource } from './photo-source'

export type Zone = { department: DepartmentCode; locality: string }

/** Lo que elige el publicador (historia #59). Se guarda en `pets.status`. */
export const PET_STATUSES = ['available', 'in_process', 'paused', 'adopted'] as const
export type PetStatus = (typeof PET_STATUSES)[number]

/** El estado que se ve: lo elegido, o vencida y dada de baja, que se derivan (research R1). */
export type PetState = PetStatus | 'expired' | 'taken_down'
export const PET_STATES: readonly PetState[] = [...PET_STATUSES, 'expired', 'taken_down']

export const PET_STATUS_ACTIONS = [
  'mark_in_process',
  'mark_available',
  'pause',
  'resume',
  'mark_adopted',
  'renew',
  'republish',
] as const
export type PetStatusAction = (typeof PET_STATUS_ACTIONS)[number]

export const TAKEDOWN_REASONS = [
  'photos_not_the_animal',
  'sale_or_money',
  'not_dog_or_cat',
  'contact_or_address',
  'other',
] as const
export type TakedownReason = (typeof TAKEDOWN_REASONS)[number]

/** El motivo de una baja, que su publicador lee tal cual; `note` solo con «otro». */
export type Takedown = { reason: TakedownReason; note: string | null }

/** Una foto guardada, con sus URLs ya firmadas y el ThumbHash armado como data URL. */
export type PetPhotoData = {
  id: string
  width: number
  height: number
  placeholder: string
  urls: { thumb: string; card: string; full: string }
}

/** Lo que muestra una card en «Mis animales». */
export type PetSummary = {
  id: string
  /** El del enlace de la ficha (historia #57). */
  code: string
  name: string
  species: Species
  sex: Sex
  zone: Zone
  isUrgent: boolean
  state: PetState
  /** Solo disponible o en proceso; vencida, el instante en que venció. */
  expiresAt: Date | null
  takedown: Takedown | null
  cover: PetPhotoData
}

/** La publicación como la ve su dueña al editarla. */
export type Pet = {
  id: string
  name: string
  species: Species
  sex: Sex
  /** La edad de hoy. */
  age: Age
  /** La guardada, con el día desde el que avanza. */
  ageBase: StoredAge
  size: Size
  isNeutered: boolean
  vaccines: Vaccines
  hasChip: boolean
  goodWithKids: GoodWith
  goodWithDogs: GoodWith
  goodWithCats: GoodWith
  description: string | null
  zone: Zone
  isUrgent: boolean
  /** Quién puede solicitarlo: 1 teléfono verificado, 2 identidad verificada. */
  requiredLevel: 1 | 2
  publishedOn: string
  state: PetState
  photos: PetPhotoData[]
}

/** El formulario, en cadenas y claves: es también lo que guarda lo escrito en el navegador. */
export type PetFormValues = {
  name: string
  species: string
  sex: string
  ageValue: string
  ageUnit: string
  size: string
  isNeutered: string
  vaccines: string
  hasChip: string
  goodWithKids: string
  goodWithDogs: string
  goodWithCats: string
  description: string
  department: string
  locality: string
  isUrgent: boolean
  requiredLevel: string
}

export const EMPTY_PET_FORM: PetFormValues = {
  name: '',
  species: '',
  sex: '',
  ageValue: '',
  ageUnit: '',
  size: '',
  isNeutered: '',
  vaccines: '',
  hasChip: '',
  goodWithKids: 'unknown',
  goodWithDogs: 'unknown',
  goodWithCats: 'unknown',
  description: '',
  department: '',
  locality: '',
  isUrgent: false,
  requiredLevel: '1',
}

/** Quien publica, con lo único que se abre de su perfil (FR-004, FR-007). */
export type Publisher = {
  name: string
  /** URL firmada, o null sin foto. */
  avatar: string | null
  isRescuer: boolean
  /** 1 o 2; null solo cuando la dueña mira su ficha oculta: no se le dice un nivel que no tiene. */
  level: 1 | 2 | 3 | null
}

/** Una publicación del listado, con la edad de hoy y la portada firmada. */
export type ListedPet = {
  code: string
  name: string
  species: Species
  sex: Sex
  age: Age
  zone: Zone
  isUrgent: boolean
  /** Disponible o en proceso: el listado no muestra otros. */
  status: 'available' | 'in_process'
  /** Como lo devuelve la base, sin redondear: es la mitad del cursor. */
  publishedAt: string
  cover: PetPhotoData
}

export type ListingPage = {
  pets: ListedPet[]
  /** Con cursor, lo que queda; sin cursor, el total con los filtros. */
  total: number
  /** La hora de la firma de las fotos (ISO): pasado el margen, se vuelven a pedir (R11). */
  signedAt: string
}

/**
 * Qué ve quien no es el publicador (precedencia de la spec #59, Edge Cases): pausada, vencida, sin
 * nivel 1 (`hidden`), adoptada o a la vista. Dada de baja no llega: para los demás no existe.
 */
export type PetVisibility = 'listed' | 'adopted' | 'paused' | 'expired' | 'hidden'

/** La ficha pública (FR-006). Oculta y ajena, solo se sabe eso. */
export type PublicPet = Omit<Pet, 'id' | 'ageBase' | 'requiredLevel'> & {
  visibility: PetVisibility
  code: string
  /** Solo para su publicador; null para los demás. */
  takedown: Takedown | null
  isOwner: boolean
  /** El id para «Editar», solo para su publicador. */
  editId: string | null
  publisher: Publisher
  /** La versión de la vista previa (FR-011). */
  version: string
  signedAt: string
}

export type PublicPetResult =
  | PublicPet
  | { visibility: 'hidden' | 'paused' | 'expired'; isOwner: false }
  /** Quien mira bloqueó a quien lo publicó (#13): nada del animal, solo a quién desbloquear. */
  | { visibility: 'blocked'; isOwner: false; publisherPublicId: string }

/** Una card ya armada en el servidor, con sus textos traducidos: la dibujan el servidor y el cliente. */
export type ListedCardView = {
  key: string
  href: string
  name: string
  /** La edad de hoy, en el listado; «Mis animales» no la muestra. */
  ageText?: string
  zoneText: string
  urgentText: string | null
  alt: string
  photo: PhotoSource
  /** El sello sobre la foto, ya traducido; disponible no lleva. */
  stamp?: { state: PetState; label: string }
}
