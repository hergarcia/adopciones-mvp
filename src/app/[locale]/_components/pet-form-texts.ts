import { getTranslations } from 'next-intl/server'
import type { PetFormTexts } from '@/components/pets/pet-form-types'
import type { RadioOption } from '@/components/ui/radio-group'
import {
  AGE_UNITS,
  GOOD_WITH,
  REQUIRED_LEVELS,
  SEXES,
  SIZES,
  SPECIES,
  VACCINES,
  YES_NO,
} from '@/lib/pets/options'

const ERROR_KEYS = [
  'name_required',
  'name_too_long',
  'species_required',
  'sex_required',
  'age_required',
  'age_unit_required',
  'age_range',
  'age_twelve_months',
  'size_required',
  'neutered_required',
  'vaccines_required',
  'chip_required',
  'good_with_required',
  'description_too_long',
  'department_required',
  'locality_required',
  'locality_too_long',
  'locality_street_number',
  'contact_phone',
  'contact_email',
  'contact_web',
  'contact_social',
  'photo_type',
  'photo_too_big',
  'photo_failed',
  'photos_required',
  'photos_blocked',
  'required_level_invalid',
  'invalid',
] as const

// El valor del formulario es el nivel; los textos van por nombre.
const LEVEL_KEYS = { '1': 'phone', '2': 'identity' } as const

function option(value: string, label: string): RadioOption {
  return { value, label }
}

// Publicar y editar comparten todo salvo el verbo, qué se pierde al irse y los mensajes de un
// guardado que no llegó (docs/08 §Regla de dos, como `profileFormTexts`).
export async function petFormTexts(mode: 'publish' | 'edit'): Promise<PetFormTexts> {
  const form = await getTranslations('pets.form')
  const fields = await getTranslations('pets.fields')
  const options = await getTranslations('pets.options')
  const photos = await getTranslations('pets.photos')
  const errors = await getTranslations('pets.errors')
  const dialogs = await getTranslations('pets.dialogs')
  const level = await getTranslations('pets.form.required_level')
  const publishing = mode === 'publish'

  return {
    submit: form(publishing ? 'publish_submit' : 'edit_submit'),
    fields: {
      groups: {
        animal: form('group_animal'),
        health: form('group_health'),
        livesWith: form('group_lives_with'),
        where: form('group_where'),
      },
      name: fields('name'),
      species: fields('species'),
      sex: fields('sex'),
      age: fields('age'),
      ageValue: fields('age_value'),
      ageUnit: fields('age_unit'),
      size: fields('size'),
      neutered: fields('neutered'),
      vaccines: fields('vaccines'),
      chip: fields('chip'),
      kids: fields('kids'),
      dogs: fields('dogs'),
      cats: fields('cats'),
      description: fields('description'),
      descriptionHint: form('description_hint'),
      urgent: fields('urgent'),
      transitHint: form('transit_hint'),
      requiredLevel: {
        legend: level('legend'),
        options: REQUIRED_LEVELS.map((key) => option(key, level(`options.${LEVEL_KEYS[key]}`))),
        help: Object.fromEntries(
          REQUIRED_LEVELS.map((key) => [key, level(`help.${LEVEL_KEYS[key]}`)]),
        ),
        editNote: publishing ? null : level('edit_note'),
      },
      charsLeft: { one: fields('chars_left_one'), many: fields.raw('chars_left_many') },
      charsOver: { one: fields('chars_over_one'), many: fields.raw('chars_over_many') },
      zone: {
        departmentLabel: fields('department'),
        departmentPlaceholder: fields('department_placeholder'),
        localityLabel: fields('locality'),
        localityLabelMontevideo: fields('locality_montevideo'),
        locality: {
          label: fields('locality'),
          placeholder: fields('locality_placeholder'),
          hint: fields('locality_hint'),
          suggestionsNone: fields('locality_suggestions_none'),
          suggestionsOne: fields('locality_suggestions_one'),
          suggestionsMany: fields.raw('locality_suggestions_many'),
        },
      },
      options: {
        species: SPECIES.map((key) => option(key, options(`species.${key}`))),
        sex: SEXES.map((key) => option(key, options(`sex.${key}`))),
        ageUnit: AGE_UNITS.map((key) => option(key, options(`age_unit.${key}`))),
        size: SIZES.map((key) => option(key, options(`size.${key}`))),
        yesNo: YES_NO.map((key) => option(key, options(`yes_no.${key}`))),
        vaccines: VACCINES.map((key) => option(key, options(`vaccines.${key}`))),
        goodWith: GOOD_WITH.map((key) => option(key, options(`good_with.${key}`))),
      },
    },
    photos: {
      legend: photos('legend'),
      add: photos('add'),
      addHint: photos('add_hint'),
      cover: photos('cover'),
      makeCover: photos('make_cover'),
      moveBefore: photos('move_before'),
      moveAfter: photos('move_after'),
      remove: photos('remove'),
      count: photos.raw('count'),
      alt: photos.raw('alt'),
      rejected: photos.raw('rejected'),
      overflow: { one: errors('photos_max_one'), many: errors.raw('photos_max_many') },
    },
    dialogs: {
      close: dialogs('close'),
      duplicate: {
        dog_female: dialogs.raw('duplicate_dog_female'),
        dog_male: dialogs.raw('duplicate_dog_male'),
        cat_female: dialogs.raw('duplicate_cat_female'),
        cat_male: dialogs.raw('duplicate_cat_male'),
      },
      duplicateBody: dialogs('duplicate_body'),
      duplicatePhotosLost: dialogs('duplicate_photos_lost'),
      publishAnyway: dialogs('publish_anyway'),
      backToMyPets: dialogs('back_to_my_pets'),
      sessionTitle: dialogs('session_title'),
      sessionBody: dialogs(publishing ? 'session_body_publish' : 'session_body_edit'),
      signIn: dialogs('sign_in'),
      levelTitle: dialogs('level_title'),
      levelBody: dialogs(publishing ? 'level_body_publish' : 'level_body_edit'),
      verify: dialogs('verify'),
      stay: dialogs('stay'),
      leavingTitle: dialogs(publishing ? 'leaving_publish_title' : 'leaving_edit_title'),
      leavingBody: dialogs(publishing ? 'leaving_publish_body' : 'leaving_edit_body'),
      leavingStay: dialogs('leaving_stay'),
      leavingLeave: dialogs('leaving_leave'),
    },
    errors: Object.fromEntries(ERROR_KEYS.map((key) => [`pets.errors.${key}`, errors.raw(key)])),
    uploading: form.raw('uploading'),
    sending: form(publishing ? 'publishing' : 'saving'),
    offline: errors(publishing ? 'offline_publish' : 'offline_save'),
    site: errors(publishing ? 'site_publish' : 'site_save'),
    draft: {
      restored: form('draft_restored'),
      startOver: form('start_over'),
      alreadyPublished: form('already_published'),
      seeMyPets: form('see_my_pets'),
    },
    changedElsewhere: form('changed_elsewhere'),
    reopen: form('reopen'),
  }
}
