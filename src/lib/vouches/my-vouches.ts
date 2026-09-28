import type { MyVouch } from './types'

/** A quién le falta el nivel 2 en un aval en pausa, desde quien mira; nada si cuenta. */
export type PauseMark = 'mine' | 'theirs' | 'both' | null

export function pauseMark(
  row: Pick<MyVouch, 'mineLacksLevelTwo' | 'otherLacksLevelTwo'>,
): PauseMark {
  if (row.mineLacksLevelTwo && row.otherLacksLevelTwo) return 'both'
  if (row.mineLacksLevelTwo) return 'mine'
  if (row.otherLacksLevelTwo) return 'theirs'
  return null
}

// Los avales que se ven en el perfil público de quien mira: «te avalan N» y su nivel 3 (FR-022).
export function countingReceived(rows: readonly MyVouch[]): number {
  return rows.filter((row) => row.direction === 'received' && pauseMark(row) === null).length
}
