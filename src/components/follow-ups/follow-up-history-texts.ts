import { getTranslations } from 'next-intl/server'
import { historyLines, type HistoryShow } from '@/lib/follow-ups/history'
import type { FollowUpHistory } from '@/lib/follow-ups/types'

/** Las líneas del historial que van en ese lugar, ya traducidas; vacío sin ninguna. */
export async function followUpHistoryTexts(
  history: FollowUpHistory,
  show: HistoryShow,
): Promise<string[]> {
  const lines = historyLines(history, show)
  if (lines.length === 0) return []
  const t = await getTranslations('follow_ups.history')
  return lines.map((line) => t(line.kind, { count: line.count }))
}
