import { getTranslations } from 'next-intl/server'
import {
  personRecordPath,
  RECORD_PART_KEYS,
  RECORD_PARTS,
  RECORD_STEP,
  type RecordPart,
} from '@/lib/admin/paths'
import type { PersonRecord } from '@/lib/admin/types'
import { zoneName } from '@/lib/zones/zone-name'
import { day, recordEntries, type RecordTranslator } from './record-entries'

// Los textos de la ficha de una persona, armados del lado del servidor con `messages/`
// (admin.record): la página solo compone.

/** Cuántos se ven de cada parte, leído de la dirección (`shownCount`). */
export type ShownParts = Record<RecordPart, number>

function zone(t: RecordTranslator, person: PersonRecord['person']): string {
  return person.department === null
    ? t('no_zone')
    : zoneName({ department: person.department, locality: person.locality })
}

/** «Ver más» de una parte: un tramo más de esa, las demás como estaban, y el ancla de la parte. */
function moreHref(publicId: string, shown: ShownParts, part: RecordPart): string {
  const query = new URLSearchParams(
    RECORD_PART_KEYS.map((key) => [
      RECORD_PARTS[key],
      String(key === part ? shown[key] + RECORD_STEP : shown[key]),
    ]),
  )
  return `${personRecordPath(publicId)}?${query.toString()}#${RECORD_PARTS[part]}`
}

export async function personRecordTexts(
  record: PersonRecord,
  shown: ShownParts,
  now: Date,
  locale: string,
) {
  const [t, levels, reports] = await Promise.all([
    getTranslations('admin.record'),
    getTranslations('verification.levels'),
    getTranslations('moderation.reports'),
  ])
  const { person } = record
  const where = zone(t, person)
  const entries = await recordEntries(t, record, now, locale)
  const parts = RECORD_PART_KEYS.map((part) => ({
    key: part,
    id: RECORD_PARTS[part],
    title: t(`sections.${part}`),
    empty: t(`empty.${part}`),
    entries: entries[part].slice(0, shown[part]),
    more:
      entries[part].length > shown[part]
        ? { href: moreHref(person.publicId, shown, part), label: t('more') }
        : null,
  }))
  const suspension = person.suspension
  const suspendedOn = suspension === null ? '' : day(suspension.suspendedAt, locale)

  return {
    header: {
      name: person.name,
      photoAlt: t('photo_alt', { name: person.name }),
      badge:
        person.level === 0
          ? null
          : { level: person.level, label: levels(`badge_level_${person.level}`) },
      levelLine:
        person.level === 0
          ? t('no_level', { zone: where })
          : t('level', { level: person.level, zone: where }),
      memberSince: t('member_since', { date: day(person.memberSince, locale) }),
      suspension:
        suspension === null
          ? null
          : {
              stamp: t('suspended'),
              reason: reports('quote', { text: suspension.reason }),
              by:
                suspension.suspendedBy === null
                  ? t('suspended_by_deleted', { date: suspendedOn })
                  : t('suspended_by', { name: suspension.suspendedBy, date: suspendedOn }),
            },
    },
    suspend: t('suspend'),
    parts,
  }
}

export async function goneTexts() {
  const [t, admin] = await Promise.all([getTranslations('admin.record'), getTranslations('admin')])
  return { title: t('gone_title'), body: t('gone_body'), back: admin('back') }
}
