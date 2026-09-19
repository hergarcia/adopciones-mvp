import { cookies } from 'next/headers'

export const EMAIL_COOKIE = 'pending-email'
const HISTORY_COOKIE = 'link-requests'

// El historial de pedidos de ESTE navegador, que es lo único que se le puede contar a la persona
// sin delatar a nadie (FR-006a). Va en una cookie httpOnly para que no la pueda editar desde la
// consola y saltearse la espera.
export async function readRequestHistory(): Promise<Date[]> {
  const raw = (await cookies()).get(HISTORY_COOKIE)?.value
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((value): value is number => typeof value === 'number')
      .map((ms) => new Date(ms))
  } catch {
    // Una cookie que alguien rompió a mano vale lo mismo que no tener historial: el tope por
    // dirección, que es el que protege el buzón, no depende de esto.
    return []
  }
}

export async function writeRequestHistory(history: readonly Date[]): Promise<void> {
  ;(await cookies()).set(HISTORY_COOKIE, JSON.stringify(history.map((at) => at.getTime())), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })
}

export async function readPendingEmail(): Promise<string | null> {
  return (await cookies()).get(EMAIL_COOKIE)?.value ?? null
}
