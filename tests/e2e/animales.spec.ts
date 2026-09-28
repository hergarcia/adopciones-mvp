import { expect, test, type Page } from '@playwright/test'
import { publishForRun, removeRunOwner, type RunPet } from './support/listed-pets'

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
  await page.getByRole('link', { name: 'Animales en adopción' }).click()
  await expect(page).toHaveURL(/\/animales$/)

  for (const option of ['gato', 'cachorro', 'Treinta y Tres']) {
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
  await expect(page.locator('label', { hasText: /^gato$/ }).locator('input')).toBeChecked()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolled - 200)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
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
    await page.locator('label', { hasText: /^perro$/ }).click()
    await page.getByText(/^Más filtros/).click()
    await page.locator('label', { hasText: /^chico$/ }).click()
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
