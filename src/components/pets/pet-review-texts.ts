import { getTranslations } from 'next-intl/server'
import type { Sex } from '@/lib/pets/options'
import type { TakedownReason } from '@/lib/pets/types'
import type { PetReviewDecisionTexts } from './pet-review-decision'

const ERRORS = [
  'own',
  'not_admin',
  'failed',
  'reason_required',
  'note_required',
  'note_too_long',
] as const

// Los textos de la decisión sobre una publicación, con su nombre y concordados con su sexo. Al
// navegador no le baja `messages/es.json`.
export async function petReviewDecisionTexts(pet: {
  name: string
  sex: Sex
}): Promise<PetReviewDecisionTexts> {
  const [t, fields] = await Promise.all([
    getTranslations('pet_review'),
    getTranslations('pets.fields'),
  ])
  const values = { name: pet.name, sex: pet.sex }
  const reasons: Record<TakedownReason, string> = {
    photos_not_the_animal: t('reasons.photos_not_the_animal'),
    sale_or_money: t('reasons.sale_or_money'),
    not_dog_or_cat: t('reasons.not_dog_or_cat'),
    contact_or_address: t('reasons.contact_or_address'),
    other: t('reasons.other'),
  }
  return {
    reviewed: t('reviewed'),
    retry: t('retry'),
    done: { reviewed: t('done.reviewed', values), taken_down: t('done.taken_down', values) },
    settled: { closed: t('settled.closed'), gone: t('settled.gone') },
    failures: { offline: t('errors.offline'), no_response: t('errors.failed') },
    takedown: {
      trigger: t('take_down'),
      title: t('sheet.title', values),
      legend: t('sheet.legend'),
      reasons,
      noteLabel: t('sheet.note_label'),
      reads: t('sheet.reads'),
      confirm: t('sheet.confirm'),
      close: t('sheet.close'),
      counts: {
        left: { one: fields('chars_left_one'), many: fields.raw('chars_left_many') },
        over: { one: fields('chars_over_one'), many: fields.raw('chars_over_many') },
      },
      errors: Object.fromEntries(
        ERRORS.map((key) => [`pet_review.errors.${key}`, t(`errors.${key}`)]),
      ),
    },
  }
}
