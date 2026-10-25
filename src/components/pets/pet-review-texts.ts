import { getTranslations } from 'next-intl/server'
import type { Sex } from '@/lib/pets/options'
import type { TakedownReason } from '@/lib/pets/types'
import type { PetReviewDecisionTexts } from './pet-review-decision'

const ERRORS = ['own', 'not_admin', 'reason_required', 'note_required', 'note_too_long'] as const

// Los textos de la decisión sobre una publicación, con su nombre y concordados con su sexo; los de
// una camada dicen que la decisión alcanza a sus crías (#205). Al navegador no le baja
// `messages/es.json`.
export async function petReviewDecisionTexts(
  pet: { kind: 'pet'; name: string; sex: Sex } | { kind: 'litter'; name: string },
): Promise<PetReviewDecisionTexts> {
  const [t, litter, fields] = await Promise.all([
    getTranslations('pet_review'),
    getTranslations('litters.review'),
    getTranslations('pets.fields'),
  ])
  const isLitter = pet.kind === 'litter'
  const values = { name: pet.name }
  const offline = (action: string) => t('errors.offline', { action })
  const failed = (action: string) => t('errors.failed', { action })
  const reasons: Record<TakedownReason, string> = {
    photos_not_the_animal: t('reasons.photos_not_the_animal'),
    sale_or_money: t('reasons.sale_or_money'),
    not_dog_or_cat: t('reasons.not_dog_or_cat'),
    contact_or_address: t('reasons.contact_or_address'),
    other: t('reasons.other'),
  }
  return {
    reviewed: t('reviewed'),
    done:
      pet.kind === 'litter'
        ? {
            reviewed: litter('done.reviewed', values),
            taken_down: litter('done.taken_down', values),
          }
        : {
            reviewed: t('done.reviewed', { ...values, sex: pet.sex }),
            taken_down: t('done.taken_down', { ...values, sex: pet.sex }),
          },
    settled: { closed: t('settled.closed'), gone: t('settled.gone') },
    failures: {
      offline: { reviewed: offline(t('reviewed')), taken_down: offline(t('sheet.confirm')) },
      no_response: { reviewed: failed(t('reviewed')), taken_down: failed(t('sheet.confirm')) },
    },
    takedown: {
      trigger: t('take_down'),
      title: isLitter ? litter('sheet_title', values) : t('sheet.title', values),
      legend: t('sheet.legend'),
      reasons,
      noteLabel: t('sheet.note_label'),
      reads: isLitter ? litter('sheet_reads') : t('sheet.reads'),
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
