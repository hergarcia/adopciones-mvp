import type { Page, Route } from '@playwright/test'

// Historia #318: lo que se abre con un toque contesta aunque su capa no haya llegado. Se corta solo
// el archivo que trae la capa (lo reconoce por su contenido), así el resto de la pantalla llega
// como siempre.

export const PART_FAILED = 'No pudimos traer esta parte. Revisá la señal y probá de nuevo.'
// Clases que solo están en la capa de `Sheet` y `Dialog`, y en la lista de `Select`.
export const OVERLAY_LAYER = 'md:max-w-sheet'
export const SELECT_LAYER = 'radix-select-content-available-height'

type Signal = 'up' | 'down' | 'hold'

/** El archivo con `marker`: llega (`up`), no llega (`down`) o queda colgado hasta `release` (`hold`). */
export async function cutLayer(page: Page, marker: string) {
  let signal: Signal = 'up'
  const held: (() => Promise<void>)[] = []
  await page.route('**/_next/static/chunks/*.js', async (route: Route) => {
    const response = await route.fetch()
    const body = await response.text()
    if (!body.includes(marker) || signal === 'up') return route.fulfill({ response, body })
    if (signal === 'down') return route.abort()
    // Lo que quedó colgado de una pantalla que ya se fue no tiene a quién llegar.
    held.push(() => route.fulfill({ response, body }).catch(() => {}))
    return undefined
  })
  return {
    set: (next: Signal) => {
      signal = next
    },
    release: async () => {
      signal = 'up'
      await Promise.all(held.splice(0).map((fulfill) => fulfill()))
    },
  }
}

/** El aviso de siempre debajo del botón cuando la capa no llegó. */
export const partFailedNotice = (page: Page) =>
  page.getByRole('alert').filter({ hasText: PART_FAILED })
