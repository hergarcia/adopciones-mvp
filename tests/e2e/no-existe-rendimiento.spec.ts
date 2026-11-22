import { expect, test, type Page, type Route } from '@playwright/test'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson } from './support/people'
import { signIn } from './support/pet-owner'
import { expectOpenWithin, expectTotalWithin, expectVitals, measure } from './support/screen-budget'
import { settled } from './support/slow-server'
import { expectAnswered } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #344: una dirección que no existe en ninguna parte del sitio. La de Luna en el cartel con
// una letra de menos en «animales», y una que empieza como las de «Mis animales».
const TYPO = '/anmales/LunaCartel01'
const UNDER_MY_PETS = '/mis-animales/no/existe/nada'
const TITLE = 'Acá no hay nada'
const BODY = 'Capaz que el enlace está mal, o lo que buscabas ya no está.'
const TO_LISTING = 'Ver los animales en adopción'
// El total medido en el build de esta historia (142,4 KB), redondeado hacia arriba al décimo: la
// pantalla es nueva y no tiene un total de `main`. Impide esconder peso de apertura corriéndolo a
// después de abrir.
const TOTAL_KB = 142.5
const SLOW_LISTING_MS = 3_000
// Palabras del 404 de fábrica de Next y de lo que podría colarse en inglés.
const ENGLISH = /\b(page|could not be found|not found|this|back|home)\b/i

test.use({ viewport: { width: 390, height: 844 } })

type Seen = { title: string; heading: string; body: boolean; action: string; href: string | null }

async function seen(page: Page, action: string): Promise<Seen> {
  const link = page.locator('main').getByRole('link', { name: action })
  return {
    title: await page.title(),
    heading: (await page.getByRole('heading', { level: 1 }).textContent()) ?? '',
    body: await page.getByText(BODY, { exact: true }).isVisible(),
    action: (await link.textContent())?.trim() ?? '',
    href: await link.getAttribute('href'),
  }
}

// El listado tarda 3 segundos en contestar. Devuelve cuántas veces se abrió, como página entera o
// desde adentro: la precarga del menú no cuenta, porque no es un toque.
async function slowListing(page: Page): Promise<{ opened: () => number }> {
  let opened = 0
  await page.route('**/animales**', async (route: Route) => {
    const request = route.request()
    const headers = request.headers()
    const isListing = new URL(request.url()).pathname === '/animales'
    const isInSite = headers.rsc !== undefined && headers['next-router-prefetch'] === undefined
    if (isListing && (request.isNavigationRequest() || isInSite)) {
      opened += 1
      await new Promise((resolve) => setTimeout(resolve, SLOW_LISTING_MS))
    }
    await route.fallback()
  })
  return { opened: () => opened }
}

// Covers: criterios 1 y 3 de #344
test('sin sesión, la dirección mal tipeada contesta 404 en castellano y sin nada de nadie', async ({
  page,
  request,
}) => {
  const response = await request.get(TYPO)
  expect(response.status(), 'una dirección que no existe').toBe(404)
  expect(response.headers()['x-robots-tag']).toContain('noindex')
  const html = await response.text()
  expect(html).toContain('<meta name="robots" content="noindex, nofollow"/>')
  expect(html).not.toContain('og:image')
  expect(html).not.toContain('__next_error__')

  await page.goto(TYPO)
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
  const view = await seen(page, TO_LISTING)
  expect(view).toEqual({
    title: expect.stringMatching(new RegExp(`^${TITLE} · `)),
    heading: TITLE,
    body: true,
    action: TO_LISTING,
    href: '/animales',
  })
  expect(await page.locator('main').innerText()).not.toMatch(ENGLISH)
  expect(view.title).not.toMatch(ENGLISH)

  await page.getByRole('link', { name: TO_LISTING }).click()
  await expect(page).toHaveURL(/\/animales$/)
})

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  // Covers: criterio 3 de #344
  test('el texto y la tirita vienen en el HTML del servidor', async ({ page }) => {
    await page.goto(TYPO)
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
    await expect(page.getByText(BODY, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: TO_LISTING })).toHaveAttribute('href', '/animales')
  })
})

// Covers: criterio 2 de #344
test('con sesión y sin administrar, se ve exactamente lo mismo que Administrar', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const person = await newPerson('Dani Prueba', { level: 1 })
  try {
    await signIn(page, person.email, '/administrar')
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
    const origin = new URL(page.url()).origin
    const admin = await seen(page, 'Volver a mi perfil')
    expect(admin.href).toBe('/mi-perfil')

    for (const path of [TYPO, UNDER_MY_PETS]) {
      // oxlint-disable-next-line no-await-in-loop -- una pantalla por vez, con la misma sesión
      await page.goto(`${origin}${path}`)
      // oxlint-disable-next-line no-await-in-loop
      await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
      // oxlint-disable-next-line no-await-in-loop
      expect(await seen(page, 'Volver a mi perfil'), path).toEqual(admin)
    }
  } finally {
    await removePerson(person)
  }
})

// La tirita abre el listado como página entera, y mientras el navegador espera la página nueva
// Playwright no lee la vieja: `timeTap` no sirve. Se mide igual que ahí —del `pointerdown` al primer
// cuadro con la tirita trabajando, y lo más largo que anotó Event Timing— y se guarda en la pestaña,
// que se lee cuando el listado ya llegó.
async function armTapAcrossPages(page: Page): Promise<void> {
  await page.evaluate(() => {
    let start: number | null = null
    const save = (key: string, ms: number) => sessionStorage.setItem(key, String(ms))
    sessionStorage.removeItem('tapAnswered')
    sessionStorage.setItem('tapLongest', '0')
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (start === null || Number(Reflect.get(entry, 'interactionId') ?? 0) === 0) continue
        save('tapLongest', Math.max(Number(sessionStorage.getItem('tapLongest')), entry.duration))
      }
    }).observe({ type: 'event', durationThreshold: 16 } as PerformanceObserverInit)
    document.addEventListener(
      'pointerdown',
      (event) => {
        start = event.timeStamp
      },
      { capture: true, once: true },
    )
    const frame = () => {
      const working = document.querySelector('a:has([data-link-opening])')
      if (start !== null && working?.checkVisibility({ visibilityProperty: true })) {
        save('tapAnswered', performance.now() - start)
        return
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
}

async function readTapAcrossPages(page: Page, name: string): Promise<number> {
  const ms = await page.evaluate(() =>
    Math.max(
      Number(sessionStorage.getItem('tapAnswered') ?? Number.NaN),
      Number(sessionStorage.getItem('tapLongest')),
    ),
  )
  test
    .info()
    .annotations.push({ type: 'rendimiento', description: `${name}: ${Math.round(ms)} ms` })
  return ms
}

// Covers: criterios 4 y 5 de #344
test('abre dentro del presupuesto y «Ver los animales en adopción» contesta al toque', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await throttleLikeAPhone(page)
  await withoutCache(page)

  const measured = await measure(page, TYPO)
  expectVitals('«Acá no hay nada»', measured)
  expectOpenWithin('«Acá no hay nada»', measured)
  expectTotalWithin('«Acá no hay nada»', measured, TOTAL_KB)

  const listing = await slowListing(page)
  await settled(page, TYPO)
  const name = `«${TO_LISTING}» tocado dos veces en «${TITLE}»`
  await armTapAcrossPages(page)
  await page.getByRole('link', { name: TO_LISTING }).dblclick({ noWaitAfter: true })
  await expect(page).toHaveURL(/\/animales$/, { timeout: 30_000 })
  await page.waitForLoadState('load')
  expectAnswered(name, await readTapAcrossPages(page, name))
  expect(listing.opened(), `${name}, veces que se pidió el listado`).toBe(1)
})
