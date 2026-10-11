// La usan los e2e de rendimiento y scripts/cloud/speed-check.mjs contra el sitio de verdad, que Node
// carga directo sin compilar: por eso este archivo no importa nada salvo tipos.
import type { Page } from '@playwright/test'

export type ScriptWeight = { open: number; total: number }

// Cada pantalla medida como la primera que abre la persona: con la caché del navegador, la segunda
// pantalla de la corrida bajaría solo lo que la primera no trajo y el peso daría de menos.
export async function withoutCache(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
}

// El peso de apertura de docs/07 (historia #95, research R1): los scripts, comprimidos, pedidos antes
// de que el navegador diera la pantalla por cargada; `total` suma además lo que llegó solo después,
// con la red quieta. El tope de `total` es lo que impide esconder peso corriéndolo a después.
// Cuenta el cuerpo comprimido y no `transferSize`: los encabezados HTTP no son JS y cambian de un
// servidor a otro, y con ellos la ficha pasaba o fallaba en CI según la corrida (docs/07).
export async function scriptWeight(page: Page): Promise<ScriptWeight> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1_000)
  return page.evaluate(() => {
    // Next precarga su script de arranque con `<link rel="preload" as="script">`, que el navegador
    // anota como `link` y no como `script`: sin esto quedaban afuera 3,5 KB de cada página.
    const isScript = (entry: PerformanceResourceTiming) =>
      entry.initiatorType === 'script' ||
      (entry.initiatorType === 'link' && /\.js(\?|$)/.test(entry.name))
    const [navigation] = performance.getEntriesByType('navigation')
    const loaded = navigation instanceof PerformanceNavigationTiming ? navigation.loadEventEnd : 0
    let open = 0
    let total = 0
    for (const entry of performance.getEntriesByType('resource')) {
      if (!(entry instanceof PerformanceResourceTiming) || !isScript(entry)) continue
      total += entry.encodedBodySize
      if (entry.startTime < loaded) open += entry.encodedBodySize
    }
    return { open, total }
  })
}
