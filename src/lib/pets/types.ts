import type { DepartmentCode } from '@/lib/zones/departments'
import type { Age, StoredAge } from './age'
import type { GoodWith, Sex, Size, Species, Vaccines } from './options'
import type { PhotoSource } from './photo-source'

export type Zone = { department: DepartmentCode; locality: string }

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
  name: string
  species: Species
  sex: Sex
  zone: Zone
  isUrgent: boolean
  status: 'available'
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
  publishedOn: string
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
}

/** Quien publica, con lo único que se abre de su perfil (FR-004, FR-007). */
export type Publisher = {
  name: string
  /** URL firmada, o null sin foto. */
  avatar: string | null
  isRescuer: boolean
  /** 1 o 2; null solo cuando la dueña mira su ficha oculta: no se le dice un nivel que no tiene. */
  level: 1 | 2 | null
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

/** La ficha pública (FR-006). Oculta y ajena, solo se sabe eso. */
export type PublicPet = Omit<Pet, 'id' | 'ageBase'> & {
  visibility: 'listed' | 'hidden'
  code: string
  isOwner: boolean
  /** El id para «Editar», solo para su publicador. */
  editId: string | null
  publisher: Publisher
  /** La versión de la vista previa (FR-011). */
  version: string
  signedAt: string
}

export type PublicPetResult = PublicPet | { visibility: 'hidden'; isOwner: false }

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
}
