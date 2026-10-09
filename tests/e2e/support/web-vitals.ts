import type { Page } from '@playwright/test'

export type Vitals = { lcp: number; cls: number }

// SC-008 de la historia #10 pide medir dos pantallas con sesión, y Lighthouse CI mide solo la
// portada, que no la tiene. Esto mide lo mismo que SC-008 pide sobre el build de producción: red
// de datos móviles y CPU de teléfono por el protocolo de Chrome, y LCP y CLS leídos en la página.
export async function throttleLikeAPhone(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}

export async function vitalsOf(page: Page): Promise<Vitals> {
  return page.evaluate(
    () =>
      new Promise<Vitals>((resolve) => {
        let lcp = 0
        let cls = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcp = entry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (Reflect.get(entry, 'hadRecentInput') === true) continue
            const value: unknown = Reflect.get(entry, 'value')
            cls += typeof value === 'number' ? value : 0
          }
        }).observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => resolve({ lcp, cls }), 1500)
      }),
  )
}

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
