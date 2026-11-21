import type { Page } from '@playwright/test'

const SLOW_SERVER_MS = 3_000

// La señal tan mala que cada acción del servidor tarda 3 segundos en contestar. Devuelve cuántas
// salieron, para ver que dos toques seguidos hacen la acción una sola vez.
export type SlowActions = { count: () => number; reset: () => void }

export async function slowActions(page: Page): Promise<SlowActions> {
  let count = 0
  await page.route('**/*', async (route) => {
    const request = route.request()
    if (request.method() === 'POST' && request.headers()['next-action'] !== undefined) {
      count += 1
      await new Promise((resolve) => setTimeout(resolve, SLOW_SERVER_MS))
    }
    await route.fallback()
  })
  return {
    count: () => count,
    reset: () => {
      count = 0
    },
  }
}

/** Abre la pantalla y espera a que la red quede quieta, para tocar con todo cargado. */
export async function settled(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
}
