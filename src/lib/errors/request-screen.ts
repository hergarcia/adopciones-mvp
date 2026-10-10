import { headers } from 'next/headers'
import { screenName, type ScreenName } from './screen-name'

/**
 * La pantalla desde la que se pidió lo que falló, por el `Referer` del pedido. Una tarea no trae
 * `Referer` y fuera de un pedido `headers()` lanza: las dos son ninguna pantalla.
 */
export async function requestScreen(): Promise<ScreenName> {
  try {
    const referer = (await headers()).get('referer')
    const url = referer === null ? null : URL.parse(referer)
    return url === null ? 'no_screen' : screenName(url.pathname)
  } catch {
    return 'no_screen'
  }
}
