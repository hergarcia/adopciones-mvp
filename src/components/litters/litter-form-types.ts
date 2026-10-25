import type { CountForms } from '@/components/forms/character-count'
import type { PetFormTexts, PetPhotosTexts } from '@/components/pets/pet-form-types'
import type { RadioOption } from '@/components/ui/radio-group'
import type { RemoveYoungTexts } from './remove-young-dialog'

/** Lo de cada cría y de la lista, ya traducido. */
export type YoungTexts = {
  group: string
  /** Con `{count}`. */
  count: string
  /** Con `{number}`. */
  defaultName: string
  unnamed: string
  name: string
  sex: string
  sexOptions: RadioOption[]
  description: string
  photosHint: string
  /** `legend` con `{name}`. */
  photos: PetPhotosTexts
  remove: string
  add: string
  max: string
  charsLeft: CountForms
  charsOver: CountForms
}

export type LitterFormTexts = {
  /** Lo que comparte con el formulario de un animal: campos, fotos, avisos y errores. */
  pet: PetFormTexts
  nameHint: string
  young: YoungTexts
  apply: { group: string; deliversFrom: { label: string; hint: string } }
  single: { title: string; body: string; publishAsPet: string; addYoung: string }
  /** Por especie, con `{name}`. */
  duplicate: { title: Record<string, string>; body: string }
  /** Al editar: lo que se confirma antes de guardar si se quitaron crías. */
  removal: RemoveYoungTexts
}
