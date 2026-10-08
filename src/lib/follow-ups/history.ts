import type { FollowUpHistory } from './types'

export type HistoryShow = 'given' | 'adopted' | 'both'
export type HistoryLine = { kind: 'given' | 'adopted'; count: number }

// Cada número solo si es 1 o más: un cero no se muestra (FR-040 a FR-042).
export function historyLines(history: FollowUpHistory, show: HistoryShow): HistoryLine[] {
  const lines: HistoryLine[] = []
  if (show !== 'adopted' && history.given > 0) lines.push({ kind: 'given', count: history.given })
  if (show !== 'given' && history.adopted > 0) {
    lines.push({ kind: 'adopted', count: history.adopted })
  }
  return lines
}
