import { getTranslations } from 'next-intl/server'
import type { RecordEntryProps } from '@/components/admin/record-entry'
import type { RecordPart } from '@/lib/admin/paths'
import { waitParts } from '@/lib/admin/queues'
import type { PersonRecord } from '@/lib/admin/types'
import { calendarDayLabel, momentDayLabel } from '@/lib/moderation/day-label'

// Cada antecedente de la ficha armado con sus textos (admin.record), de lo más nuevo a lo más viejo.

export type RecordTranslator = Awaited<ReturnType<typeof getTranslations<'admin.record'>>>
export type Entry = RecordEntryProps & { key: string }

const REVIEW_PATH = '/revision'

export const day = (at: Date, locale: string) => momentDayLabel(at.toISOString(), locale)

async function identityEntries(
  t: RecordTranslator,
  record: PersonRecord,
  now: Date,
  locale: string,
): Promise<Entry[]> {
  const [home, rejection] = await Promise.all([
    getTranslations('admin.home'),
    getTranslations('identity.rejection'),
  ])
  const { identity } = record
  const entries: Entry[] = []
  if (identity.open !== null) {
    const parts = waitParts(Math.max(0, now.getTime() - identity.open.sentAt.getTime()))
    const wait =
      parts.unit === 'under_hour'
        ? home('wait.under_hour')
        : home(`wait.${parts.unit}`, { count: parts.value })
    entries.push(
      identity.open.isOwn
        ? { key: 'open', title: t('identity.open'), meta: t('identity.open_own'), quiet: true }
        : {
            key: 'open',
            title: t('identity.open'),
            meta: t('identity.open_since', { wait }),
            href: `${REVIEW_PATH}/${identity.open.id}`,
          },
    )
  }
  if (identity.verifiedOn !== null) {
    entries.push({
      key: 'verified',
      title: t('identity.verified'),
      meta: calendarDayLabel(identity.verifiedOn, locale),
    })
  }
  if (identity.expiredOn !== null) {
    entries.push({
      key: 'expired',
      title: t('identity.expired'),
      meta: calendarDayLabel(identity.expiredOn, locale),
    })
  }
  return [
    ...entries,
    ...identity.rejections.map((item, index) => ({
      key: `rejected-${index}`,
      title: t('identity.rejected', { reason: rejection(`${item.reason}.inline`) }),
      meta: calendarDayLabel(item.rejectedOn, locale),
    })),
  ]
}

async function reportEntries(
  t: RecordTranslator,
  record: PersonRecord,
  locale: string,
): Promise<Entry[]> {
  if (record.person.isSelf) {
    return record.reports.ownOpen === 0
      ? []
      : [
          {
            key: 'own',
            title: t('reports.own_open', { count: record.reports.ownOpen }),
            quiet: true,
          },
        ]
  }
  const [reasons, quote] = await Promise.all([
    getTranslations('moderation.report.reasons'),
    getTranslations('moderation.reports'),
  ])
  return record.reports.items.map((item, index) => ({
    key: `report-${index}`,
    title: reasons(item.reason),
    detail: item.details === null ? null : quote('quote', { text: item.details }),
    meta:
      item.resolvedAt === null || item.resolution === null
        ? t('reports.created', { date: day(item.createdAt, locale) })
        : t('reports.closed', {
            date: day(item.createdAt, locale),
            resolution: item.resolution,
            closed: day(item.resolvedAt, locale),
          }),
    stamp: item.resolvedAt === null ? t('reports.open') : null,
  }))
}

async function suspensionEntries(
  t: RecordTranslator,
  record: PersonRecord,
  locale: string,
): Promise<Entry[]> {
  const quote = await getTranslations('moderation.reports')
  return record.suspensions.map((item, index) => {
    const date = day(item.suspendedAt, locale)
    const lifted = item.liftedAt === null ? null : day(item.liftedAt, locale)
    return {
      key: `suspension-${index}`,
      title: quote('quote', { text: item.reason }),
      detail:
        item.suspendedBy === null
          ? t('suspended_by_deleted', { date })
          : t('suspended_by', { name: item.suspendedBy, date }),
      meta:
        lifted === null
          ? null
          : item.liftedBy === null
            ? t('suspensions.lifted_by_deleted', { date: lifted })
            : t('suspensions.lifted_by', { name: item.liftedBy, date: lifted }),
    }
  })
}

function petEntries(t: RecordTranslator, record: PersonRecord, locale: string): Entry[] {
  return record.pets.map((pet) => ({
    key: pet.code,
    title: pet.name,
    detail:
      pet.takedownReason === null
        ? t('pets.state', { state: pet.state })
        : t('pets.taken_down', { reason: pet.takedownReason }),
    meta: t('pets.published', { date: day(pet.publishedAt, locale) }),
    stamp: pet.pendingReview ? t('pets.pending') : null,
  }))
}

export async function recordEntries(
  t: RecordTranslator,
  record: PersonRecord,
  now: Date,
  locale: string,
): Promise<Record<RecordPart, Entry[]>> {
  const [identity, reports, suspensions] = await Promise.all([
    identityEntries(t, record, now, locale),
    reportEntries(t, record, locale),
    suspensionEntries(t, record, locale),
  ])
  return { identity, reports, suspensions, pets: petEntries(t, record, locale) }
}
