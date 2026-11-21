import {
  DELETION_REASONS,
  type DeletionAnswer,
  type DeletionKind,
  type DeletionReason,
} from '@/lib/pets/deletion-reason'

/** Una fila de `admin_deletion_reason_summary`: cuántas respuestas hay de esa clase con esa respuesta. */
export type DeletionSummaryRow = { kind: DeletionKind; reason: DeletionAnswer; total: number }

export type DeletionCounts = { asked: number; answered: number; unanswered: number }

export type DeletionOptionCount = {
  option: DeletionReason
  total: number
  byKind: Record<DeletionKind, number>
}

/** «Por qué se borraron animales»: las cuentas en total y por clase, y las cinco opciones. */
export type DeletionSummary = DeletionCounts & {
  byKind: Record<DeletionKind, DeletionCounts>
  options: DeletionOptionCount[]
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function totalOf(rows: readonly DeletionSummaryRow[], kind: DeletionKind, reason: DeletionAnswer) {
  return sum(
    rows.filter((row) => row.kind === kind && row.reason === reason).map((row) => row.total),
  )
}

function countsOf(rows: readonly DeletionSummaryRow[], kind: DeletionKind): DeletionCounts {
  const answered = sum(DELETION_REASONS.map((reason) => totalOf(rows, kind, reason)))
  const unanswered = totalOf(rows, kind, 'unanswered')
  return { asked: answered + unanswered, answered, unanswered }
}

// Cada borrado con la pregunta dejó una sola fila, contestada o sin contestar: lo preguntado es la
// suma de las dos. Las cinco opciones salen siempre, en el orden de la historia, aunque la base no
// haya devuelto alguna.
export function deletionReasonSummary(rows: readonly DeletionSummaryRow[]): DeletionSummary {
  const pet = countsOf(rows, 'pet')
  const litter = countsOf(rows, 'litter')
  const options = DELETION_REASONS.map((option) => {
    const byKind: Record<DeletionKind, number> = {
      pet: totalOf(rows, 'pet', option),
      litter: totalOf(rows, 'litter', option),
    }
    return { option, total: byKind.pet + byKind.litter, byKind }
  })
  return {
    asked: pet.asked + litter.asked,
    answered: pet.answered + litter.answered,
    unanswered: pet.unanswered + litter.unanswered,
    byKind: { pet, litter },
    options,
  }
}
