import type { RejectionReason } from './identity'

/** Un rechazo: el día de Uruguay, `YYYY-MM-DD`, el motivo y su lugar en el orden de resolución. */
export type Rejection = { rejectedOn: string; reason: RejectionReason; sequence: number }

// El primero es «el último rechazo». Dentro del día desempata `sequence`, el `id` de la fila: la base
// serializa las resoluciones de una cuenta, así que el `id` crece en el orden en que se resolvieron.
export function newestFirst(rejections: readonly Rejection[]): Rejection[] {
  return rejections.toSorted(
    (a, b) => b.rejectedOn.localeCompare(a.rejectedOn) || b.sequence - a.sequence,
  )
}
