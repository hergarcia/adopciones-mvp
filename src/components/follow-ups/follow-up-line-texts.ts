import { getLocale, getTranslations } from 'next-intl/server'
import { followUpLine } from '@/lib/follow-ups/follow-up-view'
import type { FollowUpStatus } from '@/lib/follow-ups/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import type { FollowUpLineTexts } from './follow-up-line'

/** El renglón del seguimiento, armado en el servidor; null sin seguimiento. */
export async function followUpLineTexts(
  row: { status: FollowUpStatus; requestedAt: string } | null | undefined,
): Promise<FollowUpLineTexts | null> {
  const line = followUpLine(row)
  if (line === null) return null
  const [t, locale] = await Promise.all([getTranslations('follow_ups'), getLocale()])
  if (line.kind === 'answered') return { kind: 'stamp', label: t('answer.stamp') }
  if (line.kind === 'unanswered') return { kind: 'text', text: t('line.unanswered') }
  return { kind: 'text', text: t('line.requested', { date: momentDayLabel(line.since, locale) }) }
}
