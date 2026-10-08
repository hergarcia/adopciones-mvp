import type { RadioOption } from '@/components/ui/radio-group'
import type { ZoneTexts } from '@/components/zones/zone-fields'
import type { CountForms } from '@/components/forms/character-count'
import type { RequiredLevelTexts } from './required-level-field'

export { countText, type CountForms } from '@/components/forms/character-count'

export type PetFieldTexts = {
  groups: { animal: string; health: string; livesWith: string; where: string }
  name: string
  species: string
  sex: string
  age: string
  ageValue: string
  ageUnit: string
  size: string
  neutered: string
  vaccines: string
  chip: string
  kids: string
  dogs: string
  cats: string
  description: string
  descriptionHint: string
  urgent: string
  transitHint: string
  requiredLevel: RequiredLevelTexts
  charsLeft: CountForms
  charsOver: CountForms
  zone: ZoneTexts
  options: {
    species: RadioOption[]
    sex: RadioOption[]
    ageUnit: RadioOption[]
    size: RadioOption[]
    yesNo: RadioOption[]
    vaccines: RadioOption[]
    goodWith: RadioOption[]
  }
}

/** Lo que dice cualquier grilla de fotos, también la del seguimiento, que no ordena ni elige portada. */
export type PlainPhotosTexts = {
  legend: string
  add: string
  addHint: string
  remove: string
  /** Con `{count}`. */
  count: string
  /** Con `{position}`. */
  alt: string
  /** Con `{file}` y `{reason}`. */
  rejected: string
  overflow: CountForms
}

/** Lo de la ficha: la portada y el orden. */
export type ArrangePhotosTexts = {
  cover: string
  makeCover: string
  moveBefore: string
  moveAfter: string
}

export type PetPhotosTexts = PlainPhotosTexts & ArrangePhotosTexts

export type PetDialogTexts = {
  close: string
  /** Por especie y sexo del animal que ya existe, con `{name}`. */
  duplicate: Record<string, string>
  duplicateBody: string
  duplicatePhotosLost: string
  publishAnyway: string
  backToMyPets: string
  sessionTitle: string
  sessionBody: string
  signIn: string
  levelTitle: string
  levelBody: string
  verify: string
  stay: string
  leavingTitle: string
  leavingBody: string
  leavingStay: string
  leavingLeave: string
}

export type PetFormTexts = {
  submit: string
  fields: PetFieldTexts
  photos: PetPhotosTexts
  dialogs: PetDialogTexts
  /** Por clave de `pets.errors`, en crudo: los de contacto llevan `{fragment}`. */
  errors: Record<string, string>
  /** Con `{done}` y `{total}`. */
  uploading: string
  sending: string
  offline: string
  site: string
  draft: { restored: string; startOver: string; alreadyPublished: string; seeMyPets: string }
  changedElsewhere: string
  reopen: string
}
