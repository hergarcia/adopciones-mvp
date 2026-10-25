import type { Sex, Species } from '@/lib/pets/options'
import type { PetFormValues, PetPhotoData, Zone } from '@/lib/pets/types'

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
