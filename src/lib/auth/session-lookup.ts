// Cuando el servicio de autenticación no devuelve a nadie hay dos casos que la persona tiene que
// distinguir: que no la reconoce (la sesión se cerró, un 4xx) o que no se pudo preguntar (no
// contestó, contestó algo que no se entiende, está saturado o falló de su lado). Solo el primero es
// «volvé a entrar»; el segundo es una falla del sitio, y mandar a entrar de nuevo descartaría lo
// escrito sin motivo.
export function sessionLookupFailed(error: { status?: number } | null): boolean {
  if (error === null) return false
  const { status } = error
  return status === undefined || status === 0 || status === 429 || status >= 500
}
