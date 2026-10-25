import { getTranslations } from 'next-intl/server'
import type { LitterFormTexts } from '@/components/litters/litter-form-types'
import { SPECIES } from '@/lib/pets/options'
import { petFormTexts } from './pet-form-texts'

const LITTER_ERROR_KEYS = [
  'young_name_required',
  'young_name_too_long',
  'young_name_repeated',
  'young_description_too_long',
  'young_too_few',
  'young_too_many',
  'young_count',
  'young_name_taken',
  'delivery_date_past',
  'delivery_date_invalid',
] as const

// Lo de un animal con lo propio de la camada encima: el grupo de lo común se llama «La camada», el
// verbo es «Publicar la camada» y lo recuperado nombra a las crías.
export async function litterFormTexts(): Promise<LitterFormTexts> {
  const [pet, form, young, single, dialogs, errors, photos] = await Promise.all([
    petFormTexts('publish'),
    getTranslations('litters.form'),
    getTranslations('litters.young'),
    getTranslations('litters.single'),
    getTranslations('litters.dialogs'),
    getTranslations('litters.errors'),
    getTranslations('pets.photos'),
  ])

  return {
    pet: {
      ...pet,
      submit: form('submit'),
      fields: {
        ...pet.fields,
        name: form('name'),
        groups: { ...pet.fields.groups, animal: form('group_litter') },
      },
      errors: {
        ...pet.errors,
        ...Object.fromEntries(
          LITTER_ERROR_KEYS.map((key) => [`litters.errors.${key}`, errors(key)]),
        ),
      },
      draft: {
        ...pet.draft,
        restored: form('draft_restored'),
        alreadyPublished: form('already_published'),
      },
    },
    nameHint: form('name_hint'),
    young: {
      group: form('group_young'),
      count: form.raw('young_count'),
      defaultName: young.raw('default_name'),
      unnamed: young('unnamed'),
      name: young('name'),
      sex: young('sex'),
      sexOptions: pet.fields.options.sex,
      description: young('description'),
      photosHint: young('photos_hint'),
      photos: {
        ...pet.photos,
        legend: young.raw('photos_legend'),
        add: young('photos_add'),
        addHint: young('photos_hint'),
        count: photos.raw('count'),
      },
      remove: young('remove'),
      add: young('add'),
      max: young('max'),
      charsLeft: pet.fields.charsLeft,
      charsOver: pet.fields.charsOver,
    },
    apply: {
      group: form('group_apply'),
      deliversFrom: { label: form('delivers_from'), hint: form('delivers_from_hint') },
    },
    single: {
      title: single('title'),
      body: single('body'),
      publishAsPet: single('publish_as_pet'),
      addYoung: single('add_young'),
    },
    duplicate: {
      title: Object.fromEntries(
        SPECIES.map((species) => [species, dialogs('duplicate', { species, name: '{name}' })]),
      ),
      body: dialogs('duplicate_body'),
    },
  }
}
