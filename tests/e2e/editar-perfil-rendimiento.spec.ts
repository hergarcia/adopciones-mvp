import { expect, test, type Page, type Route } from '@playwright/test'
import { removeAvatar, uploadAvatar } from './support/avatar'
import { partFailedNotice } from './support/cut-layer'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { signIn } from './support/pet-owner'
import { expectOpenWithin, expectTotalWithin, expectVitals, measure } from './support/screen-budget'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #340: «Editá tu perfil» entra al presupuesto de «Contá quién sos» (docs/07 §Presupuesto de
// performance), que ya mide alta-rendimiento.spec.ts, con red y procesador de teléfono de gama media.
// El tope del total es también el de «Contá quién sos»: en `main` abría con 149,7 KB y 220,0 en total,
// y ahora el aviso de salir sin guardar baja apenas abre, para que aparezca aunque la señal se corte.
const EDIT_PROFILE_TOTAL_KB = 232.5
const EDIT_PROFILE = '/mi-perfil/editar'
const NAME = 'Ana Prueba'
const LEAVING = 'Tenés cambios sin guardar'
// Lo que baja después de abrir llega tarde: la pantalla ya está, y el resto todavía no.
const LATE_MS = 4_000

// Una imagen de un píxel: alcanza para que el navegador la procese.
const PHOTO = {
  name: 'foto.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
}

test.use({ viewport: { width: 390, height: 844 } })

// Con foto, como la tiene quien comparte su perfil en los grupos: es la versión más pesada.
async function rescuer(): Promise<Person> {
  const person = await newPerson(NAME, { level: 1 })
  await uploadAvatar(person.id)
  return person
}

async function cleanUp(person: Person | null): Promise<void> {
  if (person === null) return
  await removeAvatar(person.id)
  await removePerson(person)
}

async function openSignedIn(page: Page, person: Person): Promise<string> {
  await signIn(page, person.email, EDIT_PROFILE)
  await expect(page).toHaveURL(/mi-perfil\/editar/, { timeout: 30_000 })
  return new URL(page.url()).origin
}

type Late = 'late' | 'never'

// Lo que abre la pantalla es lo que trae su HTML; lo demás baja después de abrir y acá llega tarde
// (`late`) o no llega (`never`), como con la señal que se corta apenas abrió.
async function afterOpenArrives(page: Page, how: () => Late | 'on_time') {
  const opening = new Set<string>()
  await page.route(
    (url) => url.pathname === EDIT_PROFILE,
    async (route: Route) => {
      const response = await route.fetch()
      const body = await response.text()
      for (const [path] of body.matchAll(/\/_next\/static\/chunks\/[\w.-]+\.js/gu)) {
        opening.add(path)
      }
      await route.fulfill({ response, body })
    },
  )
  await page.route('**/_next/static/chunks/*.js', async (route: Route) => {
    const now = how()
    if (now === 'on_time' || opening.has(new URL(route.request().url()).pathname)) {
      return route.fallback()
    }
    if (now === 'never') return route.abort()
    await new Promise((resolve) => setTimeout(resolve, LATE_MS))
    return route.fallback().catch(() => {})
  })
}

const isAwake = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).some((input) =>
      Object.keys(input).some((key) => key.startsWith('__reactFiber')),
    ),
  )

// Apenas aparece el formulario, con la pantalla despierta y sin esperar a lo que baja después.
async function openEditing(page: Page, origin: string) {
  await page.goto(`${origin}${EDIT_PROFILE}`, { waitUntil: 'load' })
  await expect.poll(() => isAwake(page), { timeout: 30_000 }).toBe(true)
}

const nameField = (page: Page) => page.getByRole('textbox', { name: 'Cómo te llamás' })
const myProfileLink = (page: Page) =>
  page.getByRole('navigation', { name: 'Mi cuenta' }).getByRole('link', {
    name: 'Mi perfil',
    exact: true,
  })

async function openMyProfile(page: Page) {
  await page.getByRole('button', { name: /^Mi cuenta/u }).click()
  await myProfileLink(page).click()
}

const leavingDialog = (page: Page) => page.getByRole('dialog', { name: LEAVING })

async function stayEditing(page: Page, when: string) {
  const dialog = leavingDialog(page)
  await expect(dialog, `«${LEAVING}» ${when}`).toBeVisible({ timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Seguir editando' }).click()
  await expect(dialog).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe(EDIT_PROFILE)
}

// Covers: criterio 5 de #340
test('«Editá tu perfil» abre dentro de los 150 KB en el teléfono', async ({ page }) => {
  test.setTimeout(180_000)
  let person: Person | null = null
  try {
    person = await rescuer()
    const origin = await openSignedIn(page, person)
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const measured = await measure(page, `${origin}${EDIT_PROFILE}`)
    expectVitals('«Editá tu perfil»', measured)
    expectOpenWithin('«Editá tu perfil»', measured)
    expectTotalWithin('«Editá tu perfil»', measured, EDIT_PROFILE_TOTAL_KB)
  } finally {
    await cleanUp(person)
  }
})

// Covers: criterios 2 y 4 de #340
test('cambiar el nombre, la foto o el departamento apenas abre y tocar «Mi perfil» avisa antes de irse', async ({
  page,
}) => {
  test.setTimeout(240_000)
  let person: Person | null = null
  try {
    person = await rescuer()
    const origin = await openSignedIn(page, person)
    await throttleLikeAPhone(page)
    let arrival: Late | 'on_time' = 'late'
    await afterOpenArrives(page, () => arrival)

    await openEditing(page, origin)
    await nameField(page).fill('Ana Beatriz Prueba')
    await openMyProfile(page)
    await stayEditing(page, 'con el nombre primero')
    await expect(nameField(page)).toHaveValue('Ana Beatriz Prueba')
    await openMyProfile(page)
    await leavingDialog(page).getByRole('button', { name: 'Salir sin guardar' }).click()
    await expect(page).toHaveURL(/\/mi-perfil$/u, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: NAME })).toBeVisible()

    await openEditing(page, origin)
    await page.locator('input[type="file"]').setInputFiles(PHOTO)
    await openMyProfile(page)
    await stayEditing(page, 'con la foto primero')

    await openEditing(page, origin)
    await page.getByRole('combobox', { name: 'Departamento' }).click()
    await page.getByRole('option', { name: 'Maldonado' }).click()
    await openMyProfile(page)
    await stayEditing(page, 'con el departamento primero')
    await expect(page.getByRole('combobox', { name: 'Departamento' })).toHaveText(/Maldonado/u)

    // Sin cambios, o con lo cambiado guardado, no hay nada que avisar.
    arrival = 'on_time'
    await openEditing(page, origin)
    await openMyProfile(page)
    await expect(page).toHaveURL(/\/mi-perfil$/u, { timeout: 30_000 })
    await expect(leavingDialog(page)).toHaveCount(0)

    await openEditing(page, origin)
    await nameField(page).fill('Ana Beatriz Prueba')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page).toHaveURL(/\/mi-perfil\?guardado=/u, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Ana Beatriz Prueba' })).toBeVisible()
    await openMyProfile(page)
    await expect(page).toHaveURL(/\/mi-perfil$/u, { timeout: 30_000 })
    await expect(leavingDialog(page)).toHaveCount(0)
  } finally {
    await cleanUp(person)
  }
})

// Covers: criterio 3 de #340
test('con la señal cortada apenas abre, «Mi perfil» avisa y lo escrito sigue en pantalla', async ({
  page,
}) => {
  test.setTimeout(240_000)
  let person: Person | null = null
  try {
    person = await rescuer()
    const origin = await openSignedIn(page, person)
    await throttleLikeAPhone(page)
    // Como quien abre el enlace directo: con lo que «Mi perfil» dejó en la caché, el aviso llegaba
    // sin señal aunque esta pantalla no lo bajara.
    await withoutCache(page)
    let arrival: Late | 'on_time' = 'on_time'
    await afterOpenArrives(page, () => arrival)

    // Abrió entera y la señal se cortó: el aviso ya bajó.
    await page.goto(`${origin}${EDIT_PROFILE}`, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle')
    arrival = 'never'
    await nameField(page).fill('Ana Beatriz Prueba')
    await openMyProfile(page)
    await stayEditing(page, 'sin señal, con la pantalla abierta')
    await expect(nameField(page)).toHaveValue('Ana Beatriz Prueba')

    // Se cortó antes de que bajara nada de lo de después: la pantalla no se va y queda «Reintentar»,
    // que trae el aviso cuando vuelve la señal.
    await openEditing(page, origin)
    await nameField(page).fill('Ana Beatriz Prueba')
    await openMyProfile(page)
    await expect(partFailedNotice(page)).toBeVisible({ timeout: 15_000 })
    expect(new URL(page.url()).pathname).toBe(EDIT_PROFILE)
    await expect(nameField(page)).toHaveValue('Ana Beatriz Prueba')
    arrival = 'on_time'
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await stayEditing(page, 'al reintentar')
    await expect(nameField(page)).toHaveValue('Ana Beatriz Prueba')
  } finally {
    await cleanUp(person)
  }
})
