import { expect, test } from '@playwright/test'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// SC-006 y el presupuesto de docs/07: el perfil más pesado del seed —Eva, con 50 avales—, sin sesión,
// en un teléfono de 390 px con red y CPU de gama media. Los umbrales son los del presupuesto, sin
// margen: si no se sostienen, es un hallazgo de rendimiento, no un test para aflojar.
const EVA = '/perfil/SemillaEva000000000008'
const LCP_MS = 2_500
const JS_BYTES = 150 * 1024

test.use({ viewport: { width: 390, height: 844 } })

test('el perfil con 50 avales carga su contenido en menos de 2,5 s y baja menos de 150 KB de JS', async ({
  page,
}) => {
  await throttleLikeAPhone(page)
  await page.goto(EVA)
  await expect(page.getByRole('heading', { level: 1, name: 'Eva Pereira' })).toBeVisible()

  const { lcp } = await vitalsOf(page)
  expect(lcp, 'LCP del perfil, en ms').toBeGreaterThan(0)
  expect(lcp, 'LCP del perfil, en ms').toBeLessThan(LCP_MS)

  const scriptBytes = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((entry) => entry instanceof PerformanceResourceTiming)
      .filter((entry) => entry.initiatorType === 'script')
      .reduce((total, entry) => total + entry.encodedBodySize, 0),
  )
  expect(scriptBytes, 'JS que baja la página, en bytes').toBeGreaterThan(0)
  expect(scriptBytes, 'JS que baja la página, en bytes').toBeLessThan(JS_BYTES)
})
