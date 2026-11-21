import { LISTING_PATH } from '@/lib/pets/paths'
import { ALERT_PARAM } from './paths'

/**
 * Si quien entra viene de «Avisame cuando haya uno así»: vuelve al listado con la marca que crea el
 * aviso. Solo ahí la pantalla de entrar le dice que el aviso queda guardado (#267); el destino ya
 * pasó por `safeDestination`.
 */
export function isAlertReturn(destination: string): boolean {
  const url = new URL(destination, 'https://destino.invalid')
  return url.pathname === LISTING_PATH && url.searchParams.has(ALERT_PARAM)
}
