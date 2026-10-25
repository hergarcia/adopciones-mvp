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
// verbo es «Publicar la camada» (al editar, «Guardar», como un animal) y lo recuperado nombra a las
// crías.
export async function litterFormTexts(
  mode: 'publish' | 'edit' = 'publish',
): Promise<LitterFormTexts> {
  const [pet, form, young, single, dialogs, errors, photos, removal, status] = await Promise.all([
    petFormTexts(mode),
    getTranslations('litters.form'),
    getTranslations('litters.young'),
    getTranslations('litters.single'),
    getTranslations('litters.dialogs'),
    getTranslations('litters.errors'),
    getTranslations('pets.photos'),
    getTranslations('litters.removal'),
    getTranslations('pets.status.errors'),
  ])
  const deleteConfirm = removal('delete_confirm')

  return {
    pet: {
      ...pet,
      submit: mode === 'publish' ? form('submit') : pet.submit,
      fields: {
        ...pet.fields,
        name: form('name'),
        transitHint: form('transit_hint'),
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
    removal: {
      close: {
        title: { one: removal('close_title_one'), many: removal.raw('close_title_many') },
        body: { one: removal('close_body_one'), many: removal('close_body_many') },
        confirm: { one: removal('close_confirm_one'), many: removal('close_confirm_many') },
        cancel: removal('close_cancel'),
      },
      remove: {
        title: removal('delete_title'),
        body: removal('delete_body'),
        confirm: deleteConfirm,
        cancel: removal('delete_cancel'),
        offline: status('offline', { action: deleteConfirm }),
        noResponse: status('failed', { action: deleteConfirm }),
      },
      dismiss: pet.dialogs.close,
    },
  }
}
