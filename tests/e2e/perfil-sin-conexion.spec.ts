import { expect, test, type Page } from '@playwright/test'
import { linkFor } from './support/mailbox'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'

// El flujo crítico de la historia #35: un guardado del perfil que no llega deja todo lo escrito en
// pantalla, dice por qué y deja reintentar, en el alta y al editar. Contra el build de producción:
// en desarrollo el error de la acción lo tapa el overlay de Next y se estaría probando otra cosa.
test.describe.configure({ mode: 'serial' })

// Una imagen de un píxel: alcanza para que el navegador la procese y la muestre como vista previa.
const PHOTO = {
  name: 'foto.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
}

const BROKEN = [/algo se rompió/i, /no pudimos traer tu perfil/i]

async function signInAsNewPerson(page: Page) {
  const email = uniqueEmail()
  await page.goto('/entrar')
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await page.goto(linkFor(email))
  await expect(page).toHaveURL(/completar-perfil/)
  await expect(page.getByRole('button', { name: /^guardar$/i })).toBeEnabled()
}

function fields(page: Page) {
  return {
    name: page.getByRole('textbox').first(),
    department: page.getByRole('combobox').first(),
    locality: page.getByRole('combobox').last(),
    rescuer: page.getByRole('checkbox', { name: /rescato animales/i }),
    photo: page.getByRole('img', { name: 'Tu foto de perfil' }),
  }
}

async function fillProfile(page: Page, name: string) {
  const form = fields(page)
  await form.name.fill(name)
  await form.department.click()
  await page.getByRole('option', { name: 'Montevideo' }).click()
  await form.locality.fill('Malvín')
  await form.locality.press('Escape')
  await form.rescuer.check()
}

async function expectProfileIntact(page: Page, name: string, locality = 'Malvín') {
  const form = fields(page)
  await expect(form.name).toHaveValue(name)
  await expect(form.department).toHaveText(/Montevideo/)
  await expect(form.locality).toHaveValue(locality)
  await expect(form.rescuer).toBeChecked()
}

async function expectNothingBroke(page: Page) {
  await Promise.all(BROKEN.map((text) => expect(page.getByText(text)).toHaveCount(0)))
}

// Covers: US1-AS1, US1-AS2, US1-AS5 (SC-001, SC-002)
test('en el alta, un guardado sin conexión conserva todo y se reintenta con un toque', async ({
  page,
  context,
}) => {
  await signInAsNewPerson(page)
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await expect(fields(page).photo).toHaveAttribute('src', /^blob:/)
  await fillProfile(page, 'Ana Pereira')

  await context.setOffline(true)
  await page.getByRole('button', { name: /^guardar$/i }).click()

  await expect(page.getByText(/no se guardó: no hay conexión/i)).toBeVisible()
  await expectProfileIntact(page, 'Ana Pereira')
  await expect(fields(page).photo).toHaveAttribute('src', /^blob:/)
  await expectNothingBroke(page)

  // Reintentar sin red otra vez: sigue habiendo un solo aviso, no uno por intento.
  await page.getByRole('button', { name: /reintentar/i }).click()
  await expect(page.getByText(/no se guardó: no hay conexión/i)).toHaveCount(1)
  await expectProfileIntact(page, 'Ana Pereira')

  await context.setOffline(false)
  await page.getByRole('button', { name: /reintentar/i }).click()

  await expect(page).toHaveURL(/mi-perfil/)
  await expect(page.getByText('Perfil guardado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ana Pereira' })).toBeVisible()
  await expect(page.getByText('Malvín, Montevideo')).toBeVisible()
})

// Covers: US1-AS3
test('al editar, un guardado sin conexión muestra el mismo aviso y no la pantalla de error', async ({
  page,
  context,
}) => {
  await signInAsNewPerson(page)
  await fillProfile(page, 'Beatriz Silva')
  await page.getByRole('button', { name: /^guardar$/i }).click()
  await expect(page).toHaveURL(/mi-perfil/)

  await page.getByRole('link', { name: /editar mi perfil/i }).click()
  await expect(page).toHaveURL(/mi-perfil\/editar/)
  await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeEnabled()
  await fields(page).locality.fill('Pocitos')
  await fields(page).locality.press('Escape')

  await context.setOffline(true)
  await page.getByRole('button', { name: /guardar cambios/i }).click()

  await expect(page.getByText(/no se guardó: no hay conexión/i)).toBeVisible()
  await expectProfileIntact(page, 'Beatriz Silva', 'Pocitos')
  await expectNothingBroke(page)

  await context.setOffline(false)
  await page.getByRole('button', { name: /reintentar/i }).click()

  await expect(page).toHaveURL(/mi-perfil/)
  await expect(page.getByText('Cambios guardados', { exact: true })).toBeVisible()
  await expect(page.getByText('Pocitos, Montevideo')).toBeVisible()
})

// Covers: US2-AS1 (FR-011, FR-012)
test('en el alta, reintentar un guardado que llegó sin respuesta lo confirma como alta', async ({
  page,
}) => {
  await signInAsNewPerson(page)
  await fillProfile(page, 'Carla Méndez')

  // El primer guardado llega al servidor, pero la respuesta no vuelve.
  let cut = false
  await page.route(/completar-perfil/, async (route) => {
    if (cut || route.request().method() !== 'POST') return route.continue()
    cut = true
    await route.fetch()
    return route.abort('connectionreset')
  })

  await page.getByRole('button', { name: /^guardar$/i }).click()
  await expect(page.getByText(/no se guardó: el sitio no respondió/i)).toBeVisible()
  await expectProfileIntact(page, 'Carla Méndez')

  await page.getByRole('button', { name: /reintentar/i }).click()

  await expect(page).toHaveURL(/mi-perfil\?guardado=perfil/)
  await expect(page.getByText('Perfil guardado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Carla Méndez' })).toBeVisible()
})
