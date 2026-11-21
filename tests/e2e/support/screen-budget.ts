import { expect, test, type Page } from '@playwright/test'
import { scriptWeight } from './opening-weight'
import { vitalsOf } from './web-vitals'

// El presupuesto de docs/07 que frenan las pruebas de rendimiento, con la red y la CPU de un teléfono
// de gama media emuladas. Los umbrales son los de la tabla, sin margen: el peso es lo que se bajó, no
// un tiempo, y no varía entre corridas con el mismo build.
export const LCP_MS = 2_500
export const CLS = 0.05
export const OPEN_KB = 150

export const kb = (bytes: number) => (bytes / 1024).toFixed(1)

export type Measured = Awaited<ReturnType<typeof scriptWeight>> &
  Awaited<ReturnType<typeof vitalsOf>>

export async function measure(page: Page, path: string): Promise<Measured> {
  await page.goto(path, { waitUntil: 'load' })
  const vitals = await vitalsOf(page)
  const weight = await scriptWeight(page)
  test.info().annotations.push({
    type: 'rendimiento',
    description: `${path}: LCP ${Math.round(vitals.lcp)} ms, CLS ${vitals.cls.toFixed(3)}, JS de apertura ${kb(weight.open)} KB, JS total ${kb(weight.total)} KB`,
  })
  return { ...vitals, ...weight }
}

export function expectOpenWithin(screen: string, measured: Measured) {
  const limit = OPEN_KB * 1024
  expect(
    measured.open,
    `${screen}: ${kb(measured.open)} KB de apertura, ${kb(measured.open - limit)} KB por encima de ${OPEN_KB}`,
  ).toBeLessThanOrEqual(limit)
}

export function expectTotalWithin(screen: string, measured: Measured, baselineKb: number) {
  const limit = baselineKb * 1024
  expect(
    measured.total,
    `${screen}: ${kb(measured.total)} KB en total, ${kb(measured.total - limit)} KB por encima de los ${baselineKb} de partida`,
  ).toBeLessThanOrEqual(limit)
}

export function expectVitals(screen: string, measured: Measured) {
  expect(measured.lcp, `LCP de ${screen}, en ms`).toBeLessThan(LCP_MS)
  expect(measured.cls, `CLS de ${screen}`).toBeLessThan(CLS)
}
