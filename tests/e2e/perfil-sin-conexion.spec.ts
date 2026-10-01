import { expect, test, type Page } from '@playwright/test'
import { waitForLinkFor } from './support/mailbox'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'

// El flujo crítico de la historia #35: un guardado del perfil que no llega deja todo lo escrito en
// pantalla, dice por qué y se reintenta con la misma tirita, en el alta y al editar. Contra el build de producción:
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
  await page.goto(await waitForLinkFor(email))
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

  // El aviso manda a la tirita por su nombre: reintentar no es un segundo botón.
  await expect(
    page.getByText(/no se guardó: no hay conexión.*tocá «guardar» de nuevo/i),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /reintentar/i })).toHaveCount(0)
  await expectProfileIntact(page, 'Ana Pereira')
  await expect(fields(page).photo).toHaveAttribute('src', /^blob:/)
  await expectNothingBroke(page)

  // Reintentar sin red otra vez: sigue habiendo un solo aviso, no uno por intento.
  await page.getByRole('button', { name: /^guardar$/i }).click()
  await expect(page.getByText(/no se guardó: no hay conexión/i)).toHaveCount(1)
  await expectProfileIntact(page, 'Ana Pereira')

  await context.setOffline(false)
  await page.getByRole('button', { name: /^guardar$/i }).click()

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

  await expect(page.getByText(/tocá «guardar cambios» de nuevo/i)).toBeVisible()
  await expectProfileIntact(page, 'Beatriz Silva', 'Pocitos')
  await expectNothingBroke(page)

  await context.setOffline(false)
  await page.getByRole('button', { name: /guardar cambios/i }).click()

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

  await page.getByRole('button', { name: /^guardar$/i }).click()

  await expect(page).toHaveURL(/\/mi-perfil(\?|$)/)
  await expect(page.getByText('Perfil guardado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Carla Méndez' })).toBeVisible()
})

// Covers: US1-AS4 (FR-003, SC-003), US2-AS5 (FR-009)
test('en el alta, a los 30 segundos sin respuesta se puede reintentar, y la respuesta tardía no saca de la pantalla', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await signInAsNewPerson(page)
  await fillProfile(page, 'Elena Castro')

  // El primer guardado se queda colgado hasta que la prueba lo suelta, y entonces llega entero,
  // tarde: el perfil se crea después de que la persona ya vio el aviso.
  let release = () => {}
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  let holding = true
  await page.route(/completar-perfil/, async (route) => {
    if (!holding || route.request().method() !== 'POST') return route.continue()
    holding = false
    await held
    return route.continue()
  })

  await page.getByRole('button', { name: /^guardar$/i }).click()
  await expect(page.getByText(/no se guardó: el sitio no respondió/i)).toBeVisible({
    timeout: 40_000,
  })
  // Con el pedido todavía colgado: la tirita ya no está ocupada y se puede tocar otra vez.
  await expect(page.getByRole('button', { name: /^guardar$/i })).toBeEnabled()
  await expectProfileIntact(page, 'Elena Castro')

  // Lo que cambia después del aviso sigue ahí cuando llega la respuesta vieja.
  await fields(page).name.fill('Elena Castro Díaz')
  const late = page.waitForResponse(
    (response) => response.request().method() === 'POST' && /completar-perfil/.test(response.url()),
  )
  release()
  await late
  await page.waitForTimeout(1000)
  await expect(page).toHaveURL(/completar-perfil/)
  await expect(page.getByText(/no se guardó: el sitio no respondió/i)).toBeVisible()
  await expectProfileIntact(page, 'Elena Castro Díaz')

  await page.getByRole('button', { name: /^guardar$/i }).click()

  await expect(page).toHaveURL(/\/mi-perfil(\?|$)/)
  await expect(page.getByText('Perfil guardado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Elena Castro Díaz' })).toBeVisible()
})

// Covers: US3-AS1 (FR-014, SC-004, KL-024)
test('en el alta, recargar a mitad conserva nombre, departamento, localidad y marca', async ({
  page,
}) => {
  await signInAsNewPerson(page)
  await fillProfile(page, 'Daniela Ruiz')

  // Dos recargas y una espera: el borrador tiene que seguir entero después de que la pantalla
  // restaurada terminó de asentarse, no solo en el primer cuadro.
  await page.reload()
  await expect(page.getByRole('button', { name: /^guardar$/i })).toBeEnabled()
  await expectProfileIntact(page, 'Daniela Ruiz')
  await page.waitForTimeout(1000)
  await page.reload()
  await expect(page.getByRole('button', { name: /^guardar$/i })).toBeEnabled()
  await expectProfileIntact(page, 'Daniela Ruiz')
})

// Covers: FR-008
test('en el alta, con la sesión cerrada, el único paso es entrar de nuevo', async ({
  page,
  context,
}) => {
  await signInAsNewPerson(page)
  await fillProfile(page, 'Florencia Díaz')

  await context.clearCookies({ name: /^sb-/ })
  await page.getByRole('button', { name: /^guardar$/i }).click()
  await expect(page.getByText(/se cerró tu sesión/i)).toBeVisible()
  // El botón que tenía el foco se desmontó: el foco cae en la tirita que ocupa su lugar.
  await expect(page.getByRole('link', { name: /entrar de nuevo/i })).toBeFocused()

  // «Cerrar sesión» se llevaría el borrador que el aviso acaba de prometer, y no hay cuenta que
  // borrar sin sesión.
  await expect(page.getByRole('button', { name: /cerrar sesión/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /borrar mi cuenta/i })).toHaveCount(0)

  await page.getByRole('link', { name: /entrar de nuevo/i }).click()
  await expect(page).toHaveURL(/\/entrar\?next=/)
})

// Covers: FR-008
test('al editar, con la sesión cerrada, entrar de nuevo no vuelve a preguntar', async ({
  page,
  context,
}) => {
  await signInAsNewPerson(page)
  await fillProfile(page, 'Gabriela Suárez')
  await page.getByRole('button', { name: /^guardar$/i }).click()
  await expect(page).toHaveURL(/mi-perfil/)

  await page.getByRole('link', { name: /editar mi perfil/i }).click()
  await expect(page.getByRole('button', { name: /guardar cambios/i })).toBeEnabled()
  await fields(page).locality.fill('Pocitos')
  await fields(page).locality.press('Escape')

  await context.clearCookies({ name: /^sb-/ })
  await page.getByRole('button', { name: /guardar cambios/i }).click()
  await expect(page.getByText(/estos cambios ya no se pueden guardar/i)).toBeVisible()

  // El aviso ya dijo que lo cambiado se pierde: la tirita sale sin el diálogo de cambios sin guardar.
  await page.getByRole('link', { name: /entrar de nuevo/i }).click()
  await expect(page).toHaveURL(/\/entrar\?next=/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
