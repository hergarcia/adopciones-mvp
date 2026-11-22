import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import { sendApplication } from './support/applications'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import { expectOpenWithin, expectTotalWithin, expectVitals, measure } from './support/screen-budget'
import { settled } from './support/slow-server'
import { expectAnswered, timeTap, type Answer } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #350: tocar la chapita, «Qué son los niveles» y los enlaces de «Qué dice cada nivel» y del
// pedido de la identidad contesta en menos de 200 ms con red y procesador de teléfono de gama media
// (docs/07 §Presupuesto de performance), y las dos páginas que explican la verificación abren dentro
// del presupuesto. Los totales de `main` antes de #350, redondeados hacia arriba al décimo de KB,
// impiden esconder peso de apertura corriéndolo a después de abrir.
const LEVELS_TOTAL_KB = 139.9
const HOW_TOTAL_KB = 142.1

const LEVELS = '/niveles'
const HOW = '/preguntas/como-se-verifica'
const LEVELS_TITLE = 'Qué dice cada nivel'
const HOW_TITLE = '¿Cómo se verifica a las personas y qué se muestra de ellas?'
const HOW_LINK = 'Cómo se verifica y qué se muestra de cada persona'
const IDENTITY_LINK = 'Cómo se verifica y qué se hace con tu cédula'
const MOTIONS = ['no-preference', 'reduce'] as const
const SLOW_MS = 3_000
// Lo que se ve primero al soltar: el enlace tocado, apagado mientras llega lo que abre.
const OPENING: Answer[] = [{ selector: 'a:has(> [data-opening])' }]
// Una de las personas sembradas con nivel 2 que avalan a Eva: su aval sube a nivel 3.
const VOUCHER = '99999999-9999-9999-9999-000000000001'

test.use({ viewport: { width: 390, height: 844 } })

// El sitio tarda 3 segundos en contestar cada pantalla pedida desde adentro. Devuelve cuántas veces se
// pidió «Qué dice cada nivel», que es lo que cuenta cada apertura de la explicación.
async function slowSite(page: Page): Promise<{ levels: () => number }> {
  let levels = 0
  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const headers = request.headers()
    const isInSite = headers.rsc !== undefined && headers['next-router-prefetch'] === undefined
    if (request.method() === 'GET' && isInSite) {
      if (new URL(request.url()).pathname === LEVELS) levels += 1
      await new Promise((resolve) => setTimeout(resolve, SLOW_MS))
    }
    await route.fallback()
  })
  return { levels: () => levels }
}

async function levelThree(name: string): Promise<Person> {
  const person = await newPerson(name, { level: 2 })
  const vouch = await service()
    .from('vouches')
    .insert({ voucher_id: VOUCHER, vouchee_id: person.id })
  expect(vouch.error).toBeNull()
  return person
}

async function tapAndExpect(page: Page, name: string, tap: () => Promise<void>) {
  expectAnswered(name, await timeTap(page, name, tap, OPENING))
}

const levelsHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: LEVELS_TITLE, exact: true })

async function expectLevels(page: Page, marked: string | null) {
  await expect(levelsHeading(page)).toBeVisible({ timeout: 30_000 })
  const current = page.locator('li[aria-current="step"]')
  if (marked === null) await expect(current).toHaveCount(0)
  else await expect(current).toContainText(marked)
}

// Covers: criterio 4 de #350
test('«Qué dice cada nivel» y «¿Cómo se verifica…?» abren dentro de los 150 KB en el teléfono', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await throttleLikeAPhone(page)
  await withoutCache(page)

  const screens = [
    { screen: '«Qué dice cada nivel» sin nivel marcado', path: LEVELS, total: LEVELS_TOTAL_KB },
    {
      screen: '«Qué dice cada nivel» con el nivel 2 marcado',
      path: `${LEVELS}?nivel=2`,
      total: LEVELS_TOTAL_KB,
    },
    { screen: '«¿Cómo se verifica…?»', path: HOW, total: HOW_TOTAL_KB },
  ]
  for (const { screen, path, total } of screens) {
    // oxlint-disable-next-line no-await-in-loop -- una pantalla por vez, sin caché
    const measured = await measure(page, path)
    expectVitals(screen, measured)
    expectOpenWithin(screen, measured)
    expectTotalWithin(screen, measured, total)
  }
})

for (const motion of MOTIONS) {
  // Covers: criterios 1, 2, 3 y 5 de #350
  test(`la chapita de Carla y los enlaces de «Qué dice cada nivel» contestan en menos de 200 ms (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    const carla = await levelThree('Carla Prueba')
    try {
      const profile = `/perfil/${carla.publicId}`
      await page.emulateMedia({ reducedMotion: motion })
      await throttleLikeAPhone(page)
      const site = await slowSite(page)
      await settled(page, profile)
      const badge = page.getByRole('link', { name: 'Verificado, nivel 3. Qué significa' })

      // Apoyada y sin soltar, se hunde; con «reducir movimiento», no. Soltarla afuera no la abre.
      const box = await badge.boundingBox()
      expect(box).not.toBeNull()
      await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20)
      await page.mouse.down()
      await page.waitForTimeout(300)
      const pressed = await badge.evaluate((link) => getComputedStyle(link).transform)
      await page.mouse.move(1, 1)
      await page.mouse.up()
      if (motion === 'reduce') expect(pressed, 'la chapita apoyada, sin movimiento').toBe('none')
      else expect(pressed, 'la chapita apoyada').not.toBe('none')

      await tapAndExpect(page, `La chapita de Carla tocada dos veces (${motion})`, () =>
        badge.dblclick(),
      )
      await expect(badge).toHaveCSS('opacity', '0.6')
      await expectLevels(page, 'Nivel 3')
      expect(site.levels(), 'la chapita tocada dos veces, veces que se pidió la explicación').toBe(
        1,
      )

      const back = page.getByRole('link', { name: 'Volver', exact: true })
      await tapAndExpect(page, `«Volver» en «Qué dice cada nivel» (${motion})`, () => back.click())
      await expect(page.getByRole('heading', { level: 1, name: carla.name })).toBeVisible({
        timeout: 30_000,
      })
      expect(new URL(page.url()).pathname).toBe(profile)

      await badge.click()
      await expectLevels(page, 'Nivel 3')
      const how = page.getByRole('link', { name: HOW_LINK })
      await tapAndExpect(page, `«${HOW_LINK}» en «Qué dice cada nivel» (${motion})`, () =>
        how.click(),
      )
      await expect(page.getByRole('heading', { level: 1, name: HOW_TITLE })).toBeVisible({
        timeout: 30_000,
      })

      // Atrás con el navegador hasta el perfil: la chapita, quieta.
      await page.goBack()
      await expect(levelsHeading(page)).toBeVisible({ timeout: 30_000 })
      await page.goBack()
      await expect(badge).toBeVisible({ timeout: 30_000 })
      await expect(page.locator('a:has(> [data-opening])')).toHaveCount(0)

      // Con Ctrl abre en otra pestaña: esta no se apaga ni se va. La pestaña nueva no se espera, porque
      // con varias pruebas en paralelo el navegador a veces no la avisa; se cierra si aparece.
      const closeTab = (tab: Page) => void tab.close()
      page.context().on('page', closeTab)
      await badge.click({ modifiers: ['ControlOrMeta'] })
      await page.waitForTimeout(SLOW_MS / 2)
      await expect(page.locator('a:has(> [data-opening])')).toHaveCount(0)
      expect(new URL(page.url()).pathname).toBe(profile)
      page.context().off('page', closeTab)
    } finally {
      await removePerson(carla)
    }
  })
}

type Place = { name: string; path: string; link: (page: Page) => Locator; opens: 'levels' | 'how' }

async function tapEach(page: Page, places: Place[]) {
  for (const place of places) {
    // oxlint-disable-next-line no-await-in-loop -- una pantalla por vez, con la misma pestaña
    await settled(page, place.path)
    // oxlint-disable-next-line no-await-in-loop
    await tapAndExpect(page, place.name, () => place.link(page).click())
    const heading = place.opens === 'levels' ? LEVELS_TITLE : HOW_TITLE
    // oxlint-disable-next-line no-await-in-loop
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible({
      timeout: 30_000,
    })
  }
}

const toLevels = (page: Page) => page.locator(`main a[href^="${LEVELS}"]`).first()

// Covers: criterios 1 y 2 de #350, en cada lugar de «Incluye»
test('la chapita y los enlaces a la explicación contestan en menos de 200 ms en cada lugar', async ({
  page,
}) => {
  test.setTimeout(420_000)
  const carla = await levelThree('Carla Prueba')
  const bea = await newPerson('Bea Prueba', { level: 1 })
  const dino = await newPerson('Dino Prueba', { level: 0 })
  const { owner, pets } = await publishForRun([{ name: `Luna ${Date.now()}`, species: 'dog' }])
  try {
    const fromCarla = await sendApplication(carla.id, pets[0].code)
    const fromBea = await sendApplication(bea.id, pets[0].code)
    const ask = await service()
      .from('application_identity_asks')
      .insert({ application_id: fromBea })
    expect(ask.error).toBeNull()

    await throttleLikeAPhone(page)
    await slowSite(page)
    await tapEach(page, [
      { name: 'La chapita de la portada', path: '/', link: toLevels, opens: 'levels' },
      {
        name: '«Qué son los niveles» en un perfil sin verificar',
        path: `/perfil/${dino.publicId}`,
        link: (tab) => tab.getByRole('link', { name: 'Qué son los niveles' }),
        opens: 'levels',
      },
      {
        name: '«Qué dice cada nivel» en «Nosotros»',
        path: '/nosotros',
        link: toLevels,
        opens: 'levels',
      },
      { name: '«Qué dice cada nivel» en la guía', path: HOW, link: toLevels, opens: 'levels' },
    ])

    await page.unrouteAll({ behavior: 'wait' })
    await signIn(page, carla.email, '/mi-perfil')
    await expect(page).toHaveURL(/mi-perfil/)
    const origin = new URL(page.url()).origin
    await slowSite(page)
    await tapEach(page, [
      {
        name: 'La chapita en «Mi perfil»',
        path: `${origin}/mi-perfil`,
        link: toLevels,
        opens: 'levels',
      },
      {
        name: 'La chapita en la verificación aprobada',
        path: `${origin}/verificar-identidad`,
        link: toLevels,
        opens: 'levels',
      },
    ])

    await page.unrouteAll({ behavior: 'wait' })
    await page.context().clearCookies()
    await signIn(page, owner.email, `/solicitudes/${fromCarla}`)
    await expect(page.getByRole('heading', { level: 1, name: carla.name })).toBeVisible()
    await slowSite(page)
    await tapEach(page, [
      {
        name: 'La chapita de quien solicitó, en una solicitud recibida',
        path: `${origin}/solicitudes/${fromCarla}`,
        link: toLevels,
        opens: 'levels',
      },
    ])

    await page.unrouteAll({ behavior: 'wait' })
    await page.context().clearCookies()
    await signIn(page, bea.email, `/mis-solicitudes/${fromBea}`)
    await expect(page).toHaveURL(/mis-solicitudes/)
    await slowSite(page)
    await tapEach(page, [
      {
        name: 'La chapita de quien publicó, en «Mi solicitud»',
        path: `${origin}/mis-solicitudes/${fromBea}`,
        link: toLevels,
        opens: 'levels',
      },
      {
        name: `«${IDENTITY_LINK}» en el pedido de la identidad`,
        path: `${origin}/verificar-identidad`,
        link: (tab) => tab.getByRole('link', { name: IDENTITY_LINK }),
        opens: 'how',
      },
    ])
  } finally {
    await Promise.all([carla, bea, dino].map(removePerson))
    await removeRunOwner(owner.id)
  }
})
