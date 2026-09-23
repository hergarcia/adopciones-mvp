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
