import type { DepartmentCode } from '@/lib/zones/departments'
import type { Age, StoredAge } from './age'
import type { GoodWith, Sex, Size, Species, Vaccines } from './options'

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
