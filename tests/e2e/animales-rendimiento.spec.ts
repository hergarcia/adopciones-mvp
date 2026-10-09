import { expect, test, type Page } from '@playwright/test'
import { publishForRun, removeRunOwner, type RunPet } from './support/listed-pets'
import { signIn } from './support/pet-owner'
import { scriptWeight, throttleLikeAPhone, vitalsOf, withoutCache } from './support/web-vitals'

// El freno de la ficha y el listado (historia #95, research R7) y el presupuesto de #57, con la red
// y la CPU de un teléfono de gama media emuladas. `.lighthouserc.json` mide solo la portada
// (KL-57-3), así que esto es lo que mide el listado y la ficha. Los umbrales son los de la spec, sin
// margen: el peso es lo que se bajó, no un tiempo, y no varía entre corridas con el mismo build.
const LCP_MS = 2_500
const CLS = 0.05
const OPEN_KB = 150
// Los totales de `main` antes de #95 (research R6): el tope que impide esconder peso de apertura
// corriéndolo a después de abrir. Se mide sin sesión: con sesión, lo que se precarga después de
// abrir cambia de una corrida a otra (209 a 218 KB en `main`) y el tope sería ruido.
const SHEET_TOTAL_KB = 188.2
const LISTING_TOTAL_KB = 169.4
// El tope que tenía Lighthouse sobre todo el JS de la portada (153.600 bytes con encabezados), que
// sale de `.lighthouserc.json` (docs/07, 2026-10-09): acá, en gzip, como el resto.
const HOME_TOTAL_KB = 150
const SHARE_AFTER_LOAD_MS = 1_500
const MISSING_CODE = 'NoExiste0000'

function litter(count: number): RunPet[] {
  const tag = Math.random().toString(36).slice(2, 7)
  return Array.from({ length: count }, (_, index) => ({
    name: `${tag} ${index + 1}`,
    species: 'dog' as const,
    department: 'UY-RO',
    locality: 'La Paloma',
  }))
}

const kb = (bytes: number) => (bytes / 1024).toFixed(1)

type Measured = Awaited<ReturnType<typeof scriptWeight>> & Awaited<ReturnType<typeof vitalsOf>>

async function measure(page: Page, path: string): Promise<Measured> {
  await page.goto(path, { waitUntil: 'load' })
  const vitals = await vitalsOf(page)
  const weight = await scriptWeight(page)
  test.info().annotations.push({
    type: 'rendimiento',
    description: `${path}: LCP ${Math.round(vitals.lcp)} ms, CLS ${vitals.cls.toFixed(3)}, JS de apertura ${kb(weight.open)} KB, JS total ${kb(weight.total)} KB`,
  })
  return { ...vitals, ...weight }
}

function expectOpenWithin(screen: string, measured: Measured) {
  const limit = OPEN_KB * 1024
  expect(
    measured.open,
    `${screen}: ${kb(measured.open)} KB de apertura, ${kb(measured.open - limit)} KB por encima de ${OPEN_KB}`,
  ).toBeLessThanOrEqual(limit)
}

function expectTotalWithin(screen: string, measured: Measured, baselineKb: number) {
  const limit = baselineKb * 1024
  expect(
    measured.total,
    `${screen}: ${kb(measured.total)} KB en total, ${kb(measured.total - limit)} KB por encima de los ${baselineKb} de partida`,
  ).toBeLessThanOrEqual(limit)
}

function expectVitals(screen: string, measured: Measured) {
  expect(measured.lcp, `LCP de ${screen}, en ms`).toBeLessThan(LCP_MS)
  expect(measured.cls, `CLS de ${screen}`).toBeLessThan(CLS)
}

// Cuánto tarda «Compartir» en estar a la vista desde que la ficha terminó de abrir (FR-012). Si ya
// estaba cuando empieza a mirar, cuenta hasta ese momento: el error es hacia el lado seguro.
async function shareDelayAfterLoad(page: Page): Promise<number> {
  const delay = await page.waitForFunction(
    () => {
      const share = Array.from(document.querySelectorAll('button')).find(
        (button) =>
          button.textContent.includes('Compartir') &&
          button.getAttribute('aria-hidden') !== 'true' &&
          button.checkVisibility({ visibilityProperty: true }),
      )
      if (share === undefined) return null
      const [navigation] = performance.getEntriesByType('navigation')
      if (!(navigation instanceof PerformanceNavigationTiming)) return null
      return performance.now() - navigation.loadEventEnd
    },
    undefined,
    { polling: 'raf' },
  )
  // `waitForFunction` resuelve recién con un valor distinto de `null`.
  return (await delay.jsonValue()) ?? Number.POSITIVE_INFINITY
}

test('la ficha y el listado abren dentro de los 150 KB y el freno dice quién se pasó', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const { owner, pets } = await publishForRun(litter(8), { photo: { grain: true } })
  await throttleLikeAPhone(page)
  await withoutCache(page)
  const sheetPath = `/animales/${pets[7].code}`

  await page.goto(sheetPath, { waitUntil: 'load' })
  const shareDelay = await shareDelayAfterLoad(page)
  test.info().annotations.push({
    type: 'rendimiento',
    description: `${sheetPath}: «Compartir» a la vista ${Math.round(shareDelay)} ms después de abrir`,
  })
  expect(shareDelay, '«Compartir» a la vista después de abrir la ficha, en ms').toBeLessThanOrEqual(
    SHARE_AFTER_LOAD_MS,
  )

  const sheet = await measure(page, sheetPath)
  expectVitals('la ficha', sheet)
  expectOpenWithin('Ficha', sheet)
  expectTotalWithin('Ficha', sheet, SHEET_TOTAL_KB)

  expectOpenWithin('Animal no publicado', await measure(page, `/animales/${MISSING_CODE}`))

  const filtered = await measure(page, '/animales?departamento=rocha')
  expectVitals('el listado', filtered)
  expectOpenWithin('Listado con filtro', filtered)
  expectTotalWithin('Listado con filtro', filtered, LISTING_TOTAL_KB)

  const listing = await measure(page, '/animales')
  expectOpenWithin('Listado', listing)
  expectTotalWithin('Listado', listing, LISTING_TOTAL_KB)

  // Con los 8 de la corrida a la vista: Lighthouse mide la portada con la base de las semillas.
  const home = await measure(page, '/')
  expectVitals('la portada', home)
  expectOpenWithin('Portada', home)
  expectTotalWithin('Portada', home, HOME_TOTAL_KB)

  await signIn(page, owner.email, '/mis-animales')
  await expect(page).toHaveURL(/mis-animales/)
  await page.waitForLoadState('networkidle')
  // En el origen de la página: el enlace de ingreso deja la sesión en el dominio de `APP_URL`.
  const origin = new URL(page.url()).origin

  expectOpenWithin(
    'Ficha, con la sesión de quien publica',
    await measure(page, `${origin}${sheetPath}`),
  )
  expectOpenWithin('Listado, con sesión', await measure(page, `${origin}/animales`))

  expectVitals('«Mis animales»', await measure(page, `${origin}/mis-animales`))
  await removeRunOwner(owner.id)
})
