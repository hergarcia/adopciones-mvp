import type { FollowUpRow, FollowUpSide, FollowUpStatus, StoredFollowUpPhoto } from './types'

/** El renglón del seguimiento debajo de un adoptado en Mis animales (plan §Mis animales). */
export type FollowUpLine =
  { kind: 'requested'; since: string } | { kind: 'answered' } | { kind: 'unanswered' }

export type FollowUpView =
  | { kind: 'none' }
  | { kind: 'form' }
  | {
      kind: 'answer'
      answeredAt: string | null
      text: string | null
      photos: StoredFollowUpPhoto[]
      hidden: boolean
    }
  | { kind: 'line'; line: FollowUpLine }

// Pedido: con la fecha, sin respuesta todavía; respondido: el sello; cerrado sin respuesta: lo dice.
// Sin seguimiento —antes del día 30 o no pedido—, nada (US1-AS3).
type LineSource = { status: FollowUpStatus; requestedAt: string }

function lineOf(row: LineSource): FollowUpLine {
  if (row.status === 'requested') return { kind: 'requested', since: row.requestedAt }
  if (row.status === 'answered') return { kind: 'answered' }
  return { kind: 'unanswered' }
}

export function followUpLine(row: LineSource | null | undefined): FollowUpLine | null {
  return row === null || row === undefined ? null : lineOf(row)
}

// Lo que ve cada lado (research R10). Quien adoptó: el formulario mientras puede responder, su
// respuesta después, nada con el pedido cerrado. Quien lo dio: la respuesta —sin contenido después de
// un bloqueo— o el renglón de Mis animales.
export function followUpView(row: FollowUpRow | null, side: FollowUpSide): FollowUpView {
  if (row === null || row.side !== side) return { kind: 'none' }
  if (row.status === 'answered') {
    return {
      kind: 'answer',
      answeredAt: row.answeredAt,
      text: row.answerText,
      photos: row.photos,
      hidden: row.hidden,
    }
  }
  if (side === 'adopter') {
    return row.status === 'requested' && row.canAnswer ? { kind: 'form' } : { kind: 'none' }
  }
  return { kind: 'line', line: lineOf(row) }
}
