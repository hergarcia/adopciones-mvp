import { expect, test, type Page, type Route } from '@playwright/test'
import { publishForRun, removeRunOwner, type RunPet } from './support/listed-pets'
import { vitalsOf } from './support/web-vitals'

// Los flujos críticos de la historia #57, contra el build de producción, con animales propios de la
// corrida (research R14).

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

function litter(count: number, pet: Omit<RunPet, 'name'>): RunPet[] {
  const tag = suffix()
  return Array.from({ length: count }, (_, index) => ({ ...pet, name: `${tag} ${index + 1}` }))
}

const cards = (page: Page) => page.locator('main ul > li[id^="a-"]')

// Flujo 1 (US1, US2): el enlace sin sesión, como lo abre quien llega desde Facebook y como lo lee
// WhatsApp para armar la vista previa.
test('el enlace de un animal se abre sin sesión y trae su vista previa', async ({ page }) => {
  const name = `Tobi ${suffix()}`
  const { owner, pets } = await publishForRun([
    { name, species: 'dog', department: 'UY-MO', locality: 'Pocitos' },
  ])
  const [tobi] = pets

  await page.goto(`/animales/${tobi.code}`)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(page.getByText('Teléfono verificado')).toBeVisible()
  await expect(page.getByText('Ana Prueba')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Compartir' })).toBeVisible()

  const html = await (await page.request.get(`/animales/${tobi.code}`)).text()
  const meta = (property: string) =>
    html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1]
  expect(meta('og:title')).toBe(`${name} en adopción`)
  expect(meta('og:description')).toBe('Pocitos, Montevideo')
  const image = new URL(meta('og:image') ?? 'http://sitio')
  expect(image.pathname).toBe(`/animales/${tobi.code}/imagen`)

  const response = await page.request.get(`${image.pathname}${image.search}`)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/jpeg')
  expect((await response.body()).length).toBeLessThan(300 * 1024)

  // FR-012: el listado también arma su tarjeta, no solo las fichas (robots.txt compara por prefijo).
  const robots = await (await page.request.get('/robots.txt')).text()
  expect(robots).toMatch(/^User-Agent: facebookexternalhit$[\s\S]*?^Allow: \/animales$/m)
  await removeRunOwner(owner.id)
})

// Flujo 2 (US3-AS1, AS5, AS6): filtrar, «Ver más», abrir un animal y volver atrás al mismo lugar;
// otro «volver atrás» sale del listado, porque los filtros no sumaron pasos (FR-017a).
test('filtrar, ver más, abrir y volver deja el listado como estaba', async ({ page }) => {
  const { owner, pets } = await publishForRun(
    litter(26, {
      species: 'cat',
      ageValue: 3,
      ageUnit: 'months',
      department: 'UY-TT',
      locality: 'Treinta y Tres',
    }),
  )

  await page.goto('/mi-perfil')
  await page.goto('/')
  await page.getByRole('link', { name: 'Animales en adopción', exact: true }).click()
  await expect(page).toHaveURL(/\/animales$/)

  for (const option of ['Gato', 'Cachorro', 'Treinta y Tres']) {
    const answered = page.waitForResponse((response) => response.url().includes('/api/animales'))
    // oxlint-disable-next-line no-await-in-loop -- una marca por vez, como las toca una persona
    await page.locator('label', { hasText: new RegExp(`^${option}$`) }).click()
    // oxlint-disable-next-line no-await-in-loop
    await answered
  }
  await expect(page).toHaveURL(
    /\/animales\?especie=gato&edad=cachorro&departamento=treinta-y-tres$/,
  )
  await expect(cards(page)).toHaveCount(24)
  await expect(cards(page).first()).toContainText(pets[25].name)

  await page.getByRole('button', { name: 'Ver más' }).click()
  await expect(cards(page).nth(25)).toContainText(pets[0].name)
  await expect(page).toHaveURL(/mostrar=48$/)
  const loaded = await cards(page).count()

  const target = cards(page).nth(24)
  await target.scrollIntoViewIfNeeded()
  const scrolled = await page.evaluate(() => window.scrollY)
  await target.getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1, name: pets[1].name })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/especie=gato&edad=cachorro&departamento=treinta-y-tres&mostrar=48$/)
  await expect(cards(page)).toHaveCount(loaded)
  await expect(page.locator('label', { hasText: /^Gato$/ }).locator('input')).toBeChecked()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolled - 200)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)

  // FR-017a: «Animales en adopción» después de filtrar muestra lo que dice la dirección, sin filtros.
  const listingLink = page.getByRole('link', { name: 'Animales en adopción', exact: true })
  await listingLink.click()
  await expect(page).toHaveURL(/\/animales$/)
  const cat = page.locator('label', { hasText: /^Gato$/ }).locator('input')
  const filtered = page.waitForResponse((response) => response.url().includes('/api/animales'))
  await page.locator('label', { hasText: /^Gato$/ }).click()
  await filtered
  await expect(page).toHaveURL(/\/animales\?especie=gato$/)
  await listingLink.click()
  await expect(page).toHaveURL(/\/animales$/)
  await expect(cat).not.toBeChecked()
  await removeRunOwner(owner.id)
})

// Flujo 3 (FR-019, SC-007): sin ejecutar nada, la ficha entera y el listado con sus filtros y «Ver
// más».
test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('la ficha y el listado se usan igual', async ({ page }) => {
    const { owner, pets } = await publishForRun(
      litter(50, { species: 'dog', size: 'small', department: 'UY-FS', locality: 'Trinidad' }),
    )
    const newest = pets[49]

    await page.goto(`/animales/${newest.code}`)
    await expect(page.getByRole('heading', { level: 1, name: newest.name })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Compartir' })).toBeHidden()
    const cover = page.getByRole('img', { name: `Foto 1 de 1 de ${newest.name}` })
    await expect(cover).toBeVisible()
    expect(await cover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    expect(await cover.evaluate((image) => getComputedStyle(image).opacity)).toBe('1')

    await page.goto('/animales')
    await page.locator('label', { hasText: /^Perro$/ }).click()
    await page.getByText(/^Más filtros/).click()
    await page.locator('label', { hasText: /^Chico$/ }).click()
    await page.locator('label', { hasText: /^Flores$/ }).click()
    await page.getByRole('button', { name: 'Ver resultados' }).click()
    await expect(page).toHaveURL(/\/animales\?especie=perro&tamano=chico&departamento=flores$/)
    await expect(cards(page)).toHaveCount(24)
    const first = cards(page).first().getByRole('img')
    expect(await first.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)

    await page.getByRole('link', { name: 'Ver más' }).click()
    await expect(page).toHaveURL(/mostrar=48#a-25$/)
    await expect(cards(page)).toHaveCount(48)
    const names = await cards(page).locator('p.afiche').allTextContents()
    expect(new Set(names).size).toBe(48)
    await removeRunOwner(owner.id)
  })
})

// Historia #95 (FR-007, FR-013, SC-007): «Compartir» llega después de abrir con su aviso y con copiar
// a mano, así anda en una computadora aunque la señal se corte después.
test.describe('«Compartir» sin señal, en una computadora', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

  test('copia y avisa, y sin permiso de copiar muestra el enlace', async ({ page, context }) => {
    // Covers: US1-AS3, US1-AS4, US1-AS5
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const name = `Luna ${suffix()}`
    const { owner, pets } = await publishForRun([
      { name, species: 'dog', department: 'UY-MO', locality: 'Pocitos' },
    ])
    const [luna] = pets
    const share = page.getByRole('button', { name: 'Compartir' })

    await page.goto(`/animales/${luna.code}`)
    await expect(share).toBeVisible()
    await context.setOffline(true)
    await share.click()
    await expect(page.getByText('Enlace copiado', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
      new RegExp(`/animales/${luna.code}$`),
    )

    await context.setOffline(false)
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('sin permiso'))
    })
    await page.goto(`/animales/${luna.code}`)
    await expect(share).toBeVisible()
    await context.setOffline(true)
    await share.click()
    const manual = page.getByRole('dialog', { name: 'Copiá el enlace' })
    await expect(manual).toBeVisible()
    await expect(manual.getByRole('textbox', { name: 'Enlace de la ficha' })).toHaveValue(
      new RegExp(`/animales/${luna.code}$`),
    )
    await context.setOffline(false)
    await removeRunOwner(owner.id)
  })
})

// Historia #95 (FR-012): si lo que llega después de abrir no llega, no hay un «Compartir» a la vista
// que no pueda avisar, y su lugar sigue reservado.
test('sin lo que llega después de abrir, «Compartir» no aparece y nada salta', async ({ page }) => {
  // Covers: US1-AS1, US1-AS6
  const { owner, pets } = await publishForRun([
    { name: `Nina ${suffix()}`, species: 'cat', department: 'UY-MO', locality: 'Pocitos' },
  ])
  let isLoaded = false
  page.on('load', () => {
    isLoaded = true
  })
  await page.route('**/_next/static/chunks/**', (route) =>
    isLoaded ? route.abort() : route.continue(),
  )

  await page.goto(`/animales/${pets[0].code}`, { waitUntil: 'load' })
  const { cls } = await vitalsOf(page)
  expect(cls, 'CLS de la ficha').toBeLessThan(0.05)
  await expect(page.getByRole('button', { name: 'Compartir' })).toHaveCount(0)
  const reserved = page.locator('button[aria-hidden="true"]', { hasText: 'Compartir' })
  await expect(reserved).toBeHidden()
  expect(
    await reserved.evaluate((button) => button.getBoundingClientRect().height),
  ).toBeGreaterThan(0)
  await removeRunOwner(owner.id)
})

// Historia #95 (FR-011): el listado llega entero en el HTML y lo que filtra sin recargar llega
// después de abrir. Un toque antes de que llegue no se pierde: se aplica cuando llega y, si no llega,
// el formulario y «Ver más» andan como sin JavaScript.
test.describe('el listado antes de que llegue lo de después', () => {
  // Cada pantalla baja lo suyo hasta `load`; lo que pide después pasa por `handle`.
  const afterLoad = async (page: Page, handle: (route: Route) => Promise<void>) => {
    let isLoaded = false
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) isLoaded = false
    })
    page.on('load', () => {
      isLoaded = true
    })
    await page.route('**/_next/static/chunks/**', (route) =>
      isLoaded ? handle(route) : route.continue(),
    )
  }

  test('un filtro tocado antes se aplica cuando llega', async ({ page }) => {
    // Covers: US2-AS3
    const { owner } = await publishForRun(
      litter(26, { species: 'dog', department: 'UY-SO', locality: 'Mercedes' }),
    )
    const held: Route[] = []
    let isReleased = false
    await afterLoad(page, async (route) => {
      if (isReleased) await route.continue()
      else held.push(route)
    })

    await page.goto('/animales', { waitUntil: 'load' })
    await expect.poll(() => held.length).toBeGreaterThan(0)
    await page.locator('label', { hasText: /^Soriano$/ }).click()
    isReleased = true
    await Promise.all(held.map((route) => route.continue()))
    await expect(page).toHaveURL(/\/animales\?departamento=soriano$/)
    await expect(cards(page)).toHaveCount(24)
    await expect(cards(page).filter({ hasNotText: 'Soriano' })).toHaveCount(0)
    await removeRunOwner(owner.id)
  })

  test('si no llega, se filtra y se ve más como sin JavaScript', async ({ page }) => {
    // Covers: US2-AS2, US2-AS3
    const { owner } = await publishForRun(
      litter(26, { species: 'dog', department: 'UY-RV', locality: 'Tranqueras' }),
    )
    await afterLoad(page, (route) => route.abort())

    await page.goto('/animales', { waitUntil: 'load' })
    await page.locator('label', { hasText: /^Rivera$/ }).click()
    await page.getByRole('button', { name: 'Ver resultados' }).click()
    await expect(page).toHaveURL(/\/animales\?departamento=rivera$/)
    await expect(cards(page)).toHaveCount(24)
    await expect(cards(page).filter({ hasNotText: 'Rivera' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Ver más' }).click()
    await expect(page).toHaveURL(/departamento=rivera&mostrar=48#a-25$/)
    await expect(cards(page).nth(24)).toBeVisible()
    await expect(cards(page).filter({ hasNotText: 'Rivera' })).toHaveCount(0)
    await removeRunOwner(owner.id)
  })

  test('si no llegó y la señal vuelve, volver al listado sin recargar lo trae entero', async ({
    page,
  }) => {
    // Covers: US2-AS2
    const { owner } = await publishForRun(
      litter(3, { species: 'cat', department: 'UY-TT', locality: 'Tacuarembó' }),
    )
    let isOffline = true
    await afterLoad(page, (route) => (isOffline ? route.abort() : route.continue()))

    await page.goto('/animales', { waitUntil: 'load' })
    await expect(page.locator('html[data-later-failed]')).toHaveCount(1)
    isOffline = false
    await page.getByRole('navigation').getByRole('link').first().click()
    await expect(page).toHaveURL(/\/$/)
    await page.getByRole('navigation').getByRole('link', { name: 'Animales en adopción' }).click()
    await expect(page).toHaveURL(/\/animales$/)
    await expect(page.locator('html[data-later-failed]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ver resultados' })).toBeHidden()
    await expect(cards(page).first()).toBeVisible()
    await removeRunOwner(owner.id)
  })
})
