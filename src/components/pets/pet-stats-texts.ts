import { getFormatter, getTranslations } from 'next-intl/server'
import { statsView } from '@/lib/pet-stats/stats-view'
import type { PublicationKind, PublicationStats } from '@/lib/pet-stats/types'
import type { GroupPostTexts } from './group-post-button'

export type PetStatsRow = {
  key: 'opens' | 'taps' | 'phone_stops' | 'identity_stops' | 'applications'
  count: number
  label: string
}

/** «Cómo le va a…» ya traducido: los números o el vacío. */
export type PetStatsView = {
  title: string
  since: string
  body:
    | { kind: 'empty'; text: string; groupPost: GroupPostTexts | null }
    | { kind: 'counts'; rows: PetStatsRow[]; level: { level: 1 | 2; text: string } }
}

// Los renglones en el orden en que pasa la gente: abre, toca, se frena, solicita (FR-014). Una camada
// es «la camada»: su nombre lo escribe quien publica, con mayúscula, y no entra a mitad de frase.
export async function petStatsTexts(
  kind: PublicationKind,
  stats: PublicationStats,
  groupPost: GroupPostTexts | null,
): Promise<PetStatsView> {
  const [t, format] = await Promise.all([getTranslations('pets.stats'), getFormatter()])
  const shape = statsView(stats)
  const since =
    shape.since.kind === 'publication'
      ? t('since_publication', { sex: stats.sex ?? 'female' })
      : t('since_day', {
          date: format.dateTime(new Date(`${shape.since.day}T12:00:00-03:00`), {
            day: 'numeric',
            month: 'long',
          }),
        })
  const title = t('title', { kind, name: stats.name })
  if (shape.kind === 'empty') {
    return {
      title,
      since,
      body: { kind: 'empty', text: t('empty', { kind, name: stats.name }), groupPost },
    }
  }
  const row = (key: PetStatsRow['key'], count: number): PetStatsRow => ({
    key,
    count,
    label: t(key, { count }),
  })
  return {
    title,
    since,
    body: {
      kind: 'counts',
      rows: [
        row('opens', stats.opens),
        row('taps', stats.taps),
        row('phone_stops', stats.phoneStops),
        ...(shape.showIdentity ? [row('identity_stops', stats.identityStops)] : []),
        row('applications', stats.applications),
      ],
      level: {
        level: stats.requiredLevel,
        text: t(stats.requiredLevel === 2 ? 'level_identity' : 'level_phone'),
      },
    },
  }
}
