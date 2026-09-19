// Tolerancia para el desfasaje de reloj entre el servicio de autenticación y la app: la fila nace
// durante el pedido, pero los dos relojes no son el mismo.
const CLOCK_SKEW_MS = 30_000

// Si la cuenta nació durante este pedido. Es la pregunta que FR-032 hace —«nace una cuenta que
// antes no existía»— y no «le falta el perfil», que también es cierto para quien lo dejó a medias
// y vuelve otro día.
export function bornInThisRequest(createdAt: Date | null, startedAt: Date): boolean {
  if (createdAt === null) return false
  return createdAt.getTime() >= startedAt.getTime() - CLOCK_SKEW_MS
}
