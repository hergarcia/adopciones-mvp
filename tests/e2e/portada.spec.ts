import { expect, test, type Page } from '@playwright/test'
import { APP_NAME } from '../../src/lib/config'
import { publishForRun, removeRunOwner, type Published } from './support/listed-pets'
import { codeFor, waitForLinkFor } from './support/mailbox'
import { removePerson, newPerson, type Person } from './support/people'
import { levelOneOwner, service, signIn } from './support/pet-owner'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'

// Los flujos críticos de la historia #61 contra el build de producción: la portada dice qué es el
// sitio y «Publicar un animal» lleva por la misma puerta de #9 y #10 a publicar (SC-001, SC-002).
// En serie: comparten la base y el buzón.
test.describe.configure({ mode: 'serial' })

const PHRASE = 'Perros y gatos en adopción, publicados por personas verificadas.'
const PUBLISH = /\/mis-animales\/publicar$/

function publishLink(page: Page) {
  return page.getByRole('link', { name: 'Publicar un animal' })
}

// Covers: US1-AS1, US1-AS2, US1-AS7, US1-AS8, SC-001
test('sin sesión, la portada dice qué es el sitio, sus dos acciones y los tres pasos', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toHaveCount(1)
  await expect(title).toHaveText(PHRASE)

  await expect(publishLink(page)).toHaveAttribute('href', '/mis-animales/publicar')
  const browse = page.getByRole('main').getByRole('link', { name: 'Ver animales en adopción' })
  await expect(browse).toHaveAttribute('href', '/animales')

  // La frase y las dos acciones entran en la primera pantalla de un teléfono.
  const boxes = await Promise.all(
    [title, publishLink(page), browse].map((element) => element.boundingBox()),
  )
  for (const box of boxes) {
    expect(box, 'a la vista').not.toBeNull()
    expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(844)
  }

  const steps = page.getByRole('region', { name: 'Si rescatás' }).getByRole('listitem')
  await expect(steps).toHaveCount(3)
  await expect(steps.nth(2)).toContainText('7 días')
  await expect(steps.nth(2)).toContainText('30 días')
  await expect(steps.nth(2)).toContainText('un toque')

  const text = await page.locator('body').innerText()
  expect(text.split(APP_NAME).length - 1, 'el nombre, una sola vez').toBe(1)
  expect(text).not.toMatch(/construyendo/i)
})

// Covers: US1-AS4, US1-AS6, SC-002
test('sin cuenta, «Publicar un animal» lleva a entrar, al perfil, al teléfono y a publicar', async ({
  page,
}) => {
  const email = uniqueEmail()
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const phone = { typed: `091 ${rest.slice(0, 3)} ${rest.slice(3)}`, e164: `+59891${rest}` }

  await page.goto('/')
  await publishLink(page).click()
  await expect(page).toHaveURL(/\/entrar\?next=%2Fmis-animales%2Fpublicar/)

  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await page.goto(await waitForLinkFor(email))

  await expect(page).toHaveURL(/completar-perfil/)
  await page.getByRole('textbox').first().fill('Valeria Prueba')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Canelones' }).click()
  await page.getByRole('combobox').last().fill('Pando')
  await page.getByRole('button', { name: /guardar/i }).click()

  await expect(page).toHaveURL(/verificar-telefono\?para=publicar/)
  await expect(
    page.getByRole('heading', { name: /para publicar, verificá tu teléfono/i }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /mandarme el código/i })).toBeEnabled()
  await page.getByRole('textbox').fill(phone.typed)
  await page.getByRole('button', { name: /mandarme el código/i }).click()
  await expect(page).toHaveURL(/verificar-telefono\/codigo/)
  await expect(page.getByRole('button', { name: /^verificar$/i })).toBeEnabled()
  await page.getByRole('textbox').fill(codeFor(phone.e164))
  await page.getByRole('button', { name: /^verificar$/i }).click()

  await expect(page).toHaveURL(PUBLISH)
  await expect(page.getByRole('heading', { level: 1, name: 'Publicar un animal' })).toBeVisible()

  const users = await service().auth.admin.listUsers({ perPage: 1000 })
  const id = users.data.users.find((user) => user.email === email)?.id
  if (id !== undefined) await service().auth.admin.deleteUser(id)
})

// Covers: US1-AS5
test('con el teléfono verificado, «Publicar un animal» lleva directo a publicar', async ({
  page,
}) => {
  const owner = await levelOneOwner()
  await signIn(page, owner.email, '/')
  await expect(page).toHaveURL(/\/$/)

  await publishLink(page).click()
  await expect(page).toHaveURL(PUBLISH)
  await expect(page.getByRole('heading', { level: 1, name: 'Publicar un animal' })).toBeVisible()

  await service().auth.admin.deleteUser(owner.id)
})

// Covers: US1-AS6
test('sin teléfono verificado, «Publicar un animal» muestra el aviso de verificación', async ({
  page,
}) => {
  const person: Person = await newPerson('Sin Teléfono', { level: 0 })
  await signIn(page, person.email, '/')
  await expect(page).toHaveURL(/\/$/)

  await publishLink(page).click()
  await expect(page).toHaveURL(/verificar-telefono\?para=publicar/)
  await expect(
    page.getByRole('heading', { name: /para publicar, verificá tu teléfono/i }),
  ).toBeVisible()

  await removePerson(person)
})

// Los de la corrida se corren a una ventana del año 3100, después de la de cualquier otra prueba
// (2999 a 3004), así son los más recientes del listado aunque otras publiquen en paralelo.
async function newestOfAll(pets: Published[]): Promise<void> {
  const start = Date.UTC(3100, 0, 1) + Math.floor(Math.random() * 365 * 24 * 60) * 60_000
  await Promise.all(
    pets.map(async (pet, index) => {
      const { error } = await service()
        .from('pets')
        .update({ published_at: new Date(start + index * 60_000).toISOString() })
        .eq('code', pet.code)
      expect(error).toBeNull()
    }),
  )
}

// Una pausada no vence: la base pide que no tenga fecha de vencimiento.
async function setStatus(code: string, status: 'in_process' | 'paused'): Promise<void> {
  const change = status === 'paused' ? { status, expires_at: null } : { status }
  const { error } = await service().from('pets').update(change).eq('code', code)
  expect(error).toBeNull()
}

const wallLinks = (page: Page) => page.locator('main ul > li[id^="a-"] a')

async function hrefsOf(page: Page, path: string): Promise<string[]> {
  await page.goto(path)
  return wallLinks(page).evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  )
}

// Covers: US2-AS1, US2-AS2, US2-AS3, US2-AS4, US2-AS5, US2-AS6, SC-003
test('la portada muestra los 8 más recientes del listado, en su orden, y llevan a su ficha', async ({
  page,
}) => {
  const tag = String(Math.floor(Math.random() * 1_000_000))
  const { owner, pets } = await publishForRun(
    Array.from({ length: 12 }, (_, index) => ({
      name: `Portada ${tag} ${String(index + 1).padStart(2, '0')}`,
      species: 'cat' as const,
      department: 'UY-LA',
      locality: 'Minas',
    })),
  )
  // Si falla a mitad, los del año 3100 quedarían primeros en todo listado sin filtros de la base local.
  try {
    await newestOfAll(pets)
    const newestFirst = [...pets].reverse()
    const href = (pet: Published) => `/animales/${pet.code}`
    const [simon] = newestFirst.slice(2, 3)
    await setStatus(simon.code, 'in_process')
    const urgent = await service()
      .from('pets')
      .update({ is_urgent: true })
      .eq('code', newestFirst[3].code)
    expect(urgent.error).toBeNull()

    await page.goto('/')
    const adopter = page.getByRole('region', { name: 'Si querés adoptar' })
    await expect(adopter).toContainText('Mirar es libre, sin registrarte.')
    await expect(adopter).toContainText(
      'Cada animal lo publica una persona con el teléfono verificado.',
    )
    await expect(adopter).toContainText('El teléfono y el contacto de nadie están a la vista.')

    const home = await hrefsOf(page, '/')
    expect(home).toEqual(newestFirst.slice(0, 8).map(href))
    expect(home).toEqual((await hrefsOf(page, '/animales')).slice(0, 8))

    await page.goto('/')
    const recent = page.getByRole('region', { name: 'Recién publicados' })
    await expect(recent.getByRole('link', { name: new RegExp(simon.name) })).toContainText(
      'En proceso',
    )
    await expect(recent.getByRole('link', { name: new RegExp(newestFirst[3].name) })).toContainText(
      'Urgente',
    )

    await setStatus(newestFirst[0].code, 'paused')
    expect(await hrefsOf(page, '/')).toEqual(newestFirst.slice(1, 9).map(href))

    await page.goto('/')
    await recent.getByRole('link', { name: new RegExp(newestFirst[1].name) }).click()
    await expect(page).toHaveURL(new RegExp(`${href(newestFirst[1])}$`))
    await expect(page.getByRole('heading', { level: 1, name: newestFirst[1].name })).toBeVisible()

    await page.goto('/')
    await recent.getByRole('link', { name: 'Ver todos' }).click()
    await expect(page).toHaveURL(/\/animales$/)
  } finally {
    await removeRunOwner(owner.id)
  }
})

// Covers: US3-AS1, US3-AS2, FR-025, FR-026
test('pegada en un grupo, la portada trae su nombre, su frase y la imagen del cartel', async ({
  request,
}) => {
  const html = await (await request.get('/')).text()
  const meta = (property: string) =>
    html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1]
  expect(meta('og:title')).toBe(APP_NAME)
  expect(meta('og:site_name')).toBe(APP_NAME)
  expect(meta('og:description')).toBe(PHRASE)
  expect(meta('og:image:alt')).toBe(PHRASE)
  const image = new URL(meta('og:image') ?? 'http://sitio')
  expect(image.pathname).toBe('/imagen')
  expect(image.searchParams.get('v')).toMatch(/^[0-9a-f]{8}$/)

  const response = await request.get(`${image.pathname}${image.search}`)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/jpeg')
  expect((await response.body()).length).toBeLessThan(300 * 1024)

  // El lector de Facebook respeta robots.txt: sin la portada y su imagen no arma la tarjeta.
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toMatch(/^User-Agent: facebookexternalhit$[\s\S]*?^Allow: \/\$$/m)
  expect(robots).toMatch(/^User-Agent: facebookexternalhit$[\s\S]*?^Allow: \/imagen$/m)
})

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  // Covers: US3-AS3, FR-022
  test('la portada se lee entera y cada enlace lleva a donde dice', async ({ page }) => {
    const name = `Portada sin JS ${String(Math.floor(Math.random() * 1_000_000))}`
    const { owner, pets } = await publishForRun([
      { name, species: 'dog', department: 'UY-RO', locality: 'Castillos' },
    ])
    try {
      await newestOfAll(pets)
      const [pet] = pets

      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(PHRASE)
      await expect(
        page.getByRole('region', { name: 'Si rescatás' }).getByRole('listitem'),
      ).toHaveCount(3)
      await expect(page.getByRole('region', { name: 'Si querés adoptar' })).toContainText(
        'Mirar es libre, sin registrarte.',
      )
      const recent = page.getByRole('region', { name: 'Recién publicados' })

      await recent.getByRole('link', { name: new RegExp(name) }).click()
      await expect(page).toHaveURL(new RegExp(`/animales/${pet.code}$`))
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

      await page.goto('/')
      await recent.getByRole('link', { name: 'Ver todos' }).click()
      await expect(page).toHaveURL(/\/animales$/)

      await page.goto('/')
      await page.getByRole('main').getByRole('link', { name: 'Ver animales en adopción' }).click()
      await expect(page).toHaveURL(/\/animales$/)

      await page.goto('/')
      await publishLink(page).click()
      await expect(page).toHaveURL(/\/entrar\?next=%2Fmis-animales%2Fpublicar/)
    } finally {
      await removeRunOwner(owner.id)
    }
  })
})
