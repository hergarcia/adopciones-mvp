import { alertsUnsubscribedEvents } from '@/lib/analytics/alert-events'
import { trackAll } from '@/lib/analytics/track'
import { hashLinkToken, isLinkToken } from '@/lib/links/link-token'
import { unsubscribeByToken } from '@/lib/supabase/queries/pet-alerts'

/**
 * «Dejar de recibir» con el token de un correo (research R6, R7), lo mismo desde la pantalla que
 * desde el botón del programa de correo. Usa solo el token, nunca la sesión: con otra cuenta abierta
 * no toca sus avisos. Lanza si la base no responde, y entonces no se cortó nada.
 */
export async function unsubscribeWithLink(token: string): Promise<'done' | 'unknown'> {
  if (!isLinkToken(token)) return 'unknown'
  const result = await unsubscribeByToken(hashLinkToken(token))
  if (result.outcome === 'unknown') return 'unknown'
  await trackAll(alertsUnsubscribedEvents(result.deleted), { visit: false })
  return 'done'
}
