export type ReviewState = 'open' | 'resolved' | 'expired' | 'gone'

export type ReviewTrace = {
  /** El pedido tal como lo ve quien administra; nulo si ya no está a la vista. */
  row: { expiresAt: Date } | null
  /** Hay registro de quién lo resolvió. */
  resolved: boolean
  /** El vencimiento que conocía la pantalla cuando se abrió el pedido. */
  knownExpiresAt: Date | null
}

// Qué le pasó a un pedido que quien administra tenía abierto (FR-021). Un pedido vencido deja de
// estar a la vista aunque la tarea todavía no lo haya borrado, así que el vencimiento que ya
// conocía la pantalla es lo que lo distingue de uno retirado. De un retiro o de una cuenta borrada
// no queda nada (FR-012a): los dos son «ya no está».
export function reviewState(trace: ReviewTrace, now: Date): ReviewState {
  if (trace.row !== null) return trace.row.expiresAt > now ? 'open' : 'expired'
  if (trace.resolved) return 'resolved'
  if (trace.knownExpiresAt !== null && trace.knownExpiresAt <= now) return 'expired'
  return 'gone'
}
