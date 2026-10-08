import { getLocale, getTranslations } from 'next-intl/server'
import type { FollowUpAnswerTexts } from '@/components/follow-ups/follow-up-answer'
import type { FollowUpFormTexts } from '@/components/follow-ups/follow-up-form'
import { followUpLineTexts } from '@/components/follow-ups/follow-up-line-texts'
import type { FollowUpSummaryTexts } from '@/components/follow-ups/follow-up-summary'
import { followUpView, type FollowUpView } from '@/lib/follow-ups/follow-up-view'
import type { FollowUpRow } from '@/lib/follow-ups/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import type { PetPhotoData } from '@/lib/pets/types'
import { followUpOf, signFollowUpPhotos } from '@/lib/supabase/queries/follow-ups'

const ERROR_KEYS = [
  'closed',
  'not_found',
  'limit',
  'photo_invalid',
  'photo_upload_failed',
  'invalid',
  'failed',
  'photos_required',
  'text_too_long',
] as const

const PHOTO_ERROR_KEYS = ['photo_type', 'photo_too_big', 'photo_failed'] as const

/** El seguimiento de una solicitud para quien mira, con sus fotos ya firmadas. */
export async function followUpWithPhotos(
  applicationId: string,
): Promise<{ row: FollowUpRow | null; photos: PetPhotoData[] }> {
  const row = await followUpOf(applicationId)
  if (row === null || row.photos.length === 0) return { row, photos: [] }
  return { row, photos: await signFollowUpPhotos(row.followUpId, row.photos) }
}

export async function followUpFormTexts(names: {
  pet: string
  publisher: string
}): Promise<FollowUpFormTexts> {
  const [form, errors, petErrors] = await Promise.all([
    getTranslations('follow_ups.form'),
    getTranslations('follow_ups.errors'),
    getTranslations('pets.errors'),
  ])
  return {
    title: form('title', { name: names.pet }),
    help: form('help', { publisher: names.publisher }),
    photos: {
      legend: form('photos.legend', { name: names.pet }),
      add: form('photos.add'),
      addHint: form('photos.add_hint'),
      remove: form('photos.remove'),
      count: String(form.raw('photos.count')),
      alt: String(form.raw('photos.alt')),
      rejected: String(form.raw('photos.rejected')),
      overflow: {
        one: form('photos.overflow_one'),
        many: String(form.raw('photos.overflow_many')),
      },
    },
    photoErrors: Object.fromEntries(
      PHOTO_ERROR_KEYS.map((key) => [`pets.errors.${key}`, petErrors(key)]),
    ),
    textLabel: form('text_label'),
    counts: {
      left: { one: form('chars_left_one'), many: String(form.raw('chars_left_many')) },
      over: { one: form('chars_over_one'), many: String(form.raw('chars_over_many')) },
    },
    submit: form('submit'),
    network: { offline: form('offline'), no_response: form('no_response') },
    errors: Object.fromEntries(
      ERROR_KEYS.map((key) => [`follow_ups.errors.${key}`, errors(key, { name: names.pet })]),
    ),
    failed: errors('failed'),
  }
}

/** La respuesta, dicha desde el lado de quien mira: «Lo contaste el …» o «Ana lo contó el …». */
export async function followUpAnswerTexts(
  view: Extract<FollowUpView, { kind: 'answer' }>,
  side: FollowUpRow['side'],
  names: { pet: string; adopter: string },
): Promise<FollowUpAnswerTexts> {
  const [t, locale] = await Promise.all([getTranslations('follow_ups.answer'), getLocale()])
  const date =
    view.answeredAt === null
      ? null
      : side === 'adopter'
        ? t('mine', { date: momentDayLabel(view.answeredAt, locale) })
        : t('theirs', { person: names.adopter, date: momentDayLabel(view.answeredAt, locale) })
  return {
    stamp: t('stamp'),
    date,
    text: view.text === null ? null : t('text', { text: view.text }),
    alts: view.photos.map((_, index) =>
      t('alt', {
        name: names.pet,
        person: names.adopter,
        position: index + 1,
        total: view.photos.length,
      }),
    ),
  }
}

/** El seguimiento para quien lo dio, con su título; null sin seguimiento a la vista. */
export async function followUpSummaryTexts(
  row: FollowUpRow | null,
  names: { pet: string; adopter: string },
): Promise<FollowUpSummaryTexts | null> {
  const view = followUpView(row, 'publisher')
  if (view.kind === 'none' || view.kind === 'form' || row === null) return null
  const t = await getTranslations('follow_ups.summary')
  if (view.kind === 'answer') {
    return {
      title: t('title'),
      body: { kind: 'answer', texts: await followUpAnswerTexts(view, 'publisher', names) },
    }
  }
  const line = await followUpLineTexts(row)
  return line === null ? null : { title: t('title'), body: { kind: 'line', texts: line } }
}
