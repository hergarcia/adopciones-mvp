import { expect, test, type Page } from '@playwright/test'
import { codeFor, hasMail, linkFor, mailTo } from './support/mailbox'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// Los flujos críticos de las historias #10 y #25, de punta a punta y contra el build de producción:
// alguien sin sesión toca «publicar», ingresa, completa el perfil, verifica su teléfono con el
// código que le llegó y vuelve a la acción que había tocado (SC-007); y alguien cuyo número está
// en otra cuenta se lo queda, y la otra cuenta se entera sin saber de quién. En el camino se miden
// las pantallas de la verificación como las ve un teléfono (SC-008).
test.describe.configure({ mode: 'serial' })

const GATE = '/verificar-telefono?para=publicar&next=%2Fmi-perfil%2Feditar'

type Phone = { typed: string; e164: string }

// Un celular por corrida, al azar: las pruebas comparten la base y cada número tiene su tope.
function uniqueNumber(): Phone {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const second = 1 + Math.floor(Math.random() * 9)
  return {
    typed: `09${second} ${rest.slice(0, 3)} ${rest.slice(3)}`,
    e164: `+5989${second}${rest}`,
  }
}

async function expectPhoneLike(page: Page) {
  const vitals = await vitalsOf(page)
  expect(vitals.lcp, 'LCP en milisegundos').toBeLessThan(2500)
  expect(vitals.cls, 'corrimiento acumulado').toBeLessThan(0.05)
}

// Desde «Entrar»: pide el enlace y entra con él.
async function signInWithLink(page: Page, email: string) {
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await page.goto(linkFor(email))
}

// Desde «Entrar», con una dirección nueva: entra y completa el perfil.
async function signUp(page: Page, email: string, name: string) {
  await signInWithLink(page, email)
  await expect(page).toHaveURL(/completar-perfil/)

  await page.getByRole('textbox').first().fill(name)
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Salto' }).click()
  await page.getByRole('combobox').last().fill('Salto')
  await page.getByRole('button', { name: /guardar/i }).click()
}

// Desde «Verificar teléfono»: pide el código y lo escribe.
async function typeCodeFor(page: Page, phone: Phone) {
  await expect(page.getByRole('button', { name: /mandarme el código/i })).toBeEnabled()
  await page.getByRole('textbox').fill(phone.typed)
  await page.getByRole('button', { name: /mandarme el código/i }).click()
  await expect(page).toHaveURL(/verificar-telefono\/codigo/)
  await expect(page.getByRole('button', { name: /^verificar$/i })).toBeEnabled()
  await page.getByRole('textbox').fill(codeFor(phone.e164))
  await page.getByRole('button', { name: /^verificar$/i }).click()
}

test('sin sesión, la puerta de publicar lleva a ingresar, verificar y volver a la acción', async ({
  page,
}) => {
  const email = uniqueEmail()
  const phone = uniqueNumber()

  // Sin sesión, la puerta pide ingresar primero, sin perder a dónde iba (FR-013c).
  await page.goto(GATE)
  await expect(page).toHaveURL(/entrar/)
  await signUp(page, email, 'Marta Suárez')

  // Después del perfil, el aviso de la acción que tocó, con el campo ahí mismo (FR-013a).
  await expect(page).toHaveURL(/verificar-telefono\?para=publicar/)
  await expect(
    page.getByRole('heading', { name: /para publicar, verificá tu teléfono/i }),
  ).toBeVisible()

  await throttleLikeAPhone(page)
  await page.reload()
  await expectPhoneLike(page)

  await expect(page.getByRole('button', { name: /mandarme el código/i })).toBeEnabled()
  await page.getByRole('textbox').fill(phone.typed)
  await page.getByRole('button', { name: /mandarme el código/i }).click()

  await expect(page).toHaveURL(/verificar-telefono\/codigo\?para=publicar/)
  await expect(page.getByText(phone.typed)).toBeVisible()
  await page.reload()
  await expectPhoneLike(page)

  await expect(page.getByRole('button', { name: /^verificar$/i })).toBeEnabled()
  await page.getByRole('textbox').fill(codeFor(phone.e164))
  await page.getByRole('button', { name: /^verificar$/i }).click()

  // A la acción que había tocado, no a su perfil (SC-007).
  await expect(page).toHaveURL(/mi-perfil\/editar$/)

  // En el mismo origen: el enlace del correo lleva a APP_URL, y la sesión vive en ese host.
  await page.goto(new URL('/mi-perfil', page.url()).toString())
  await expect(page.getByText('Verificado', { exact: true })).toBeVisible()
  await expect(page.getByText(phone.typed)).toBeVisible()
})

// El día de hoy como lo dicen el correo y «Mi perfil».
function todayLabel(): string {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'long',
    timeZone: 'America/Montevideo',
  }).format(new Date())
}

// Covers: #25 US1-AS1..AS3, US2-AS1, US2-AS2, FR-010, FR-012, SC-005, SC-007, SC-008
test('quedarse con un número de otra cuenta: la otra lo pierde y se entera sin saber de quién', async ({
  page,
}) => {
  const ana = { email: uniqueEmail(), name: 'Ana Primera' }
  const bea = { email: uniqueEmail(), name: 'Beatriz Segunda' }
  const phone = uniqueNumber()

  // La primera cuenta verifica el número.
  await page.goto('/verificar-telefono')
  await expect(page).toHaveURL(/entrar/)
  await signUp(page, ana.email, ana.name)
  await expect(page).toHaveURL(/verificar-telefono$/)
  await typeCodeFor(page, phone)
  await expect(page).toHaveURL(/mi-perfil\?guardado=telefono/)

  // La segunda llega por el aviso de publicar y escribe el código del mismo número.
  await page.context().clearCookies()
  await page.goto(GATE)
  await expect(page).toHaveURL(/entrar/)
  await signUp(page, bea.email, bea.name)
  await expect(page).toHaveURL(/verificar-telefono\?para=publicar/)
  await typeCodeFor(page, phone)

  await expect(page).toHaveURL(/verificar-telefono\/en-otra-cuenta\?para=publicar/)
  await expect(page.getByRole('heading', { name: /ese número está en otra cuenta/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /verificar otro número/i })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /entrar con esa cuenta/i }),
  ).toHaveAccessibleDescription(/se cierra la sesión de esta cuenta/i)
  await expect(page.getByText(/podés confirmarlo hasta las/i)).toBeVisible()
  await expect(page.getByText(ana.name)).toHaveCount(0)

  await page.getByRole('button', { name: /es mío y no puedo entrar a esa cuenta/i }).click()
  await expect(page).toHaveURL(/verificar-telefono\/quedarme\?para=publicar/)

  // SC-008: la confirmación, como la ve un teléfono.
  await throttleLikeAPhone(page)
  await page.reload()
  await expectPhoneLike(page)
  await expect(page.getByRole('heading', { name: /quedarte con el/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /quedarme con este número/i })).toBeEnabled()

  await page.getByRole('button', { name: /quedarme con este número/i }).click()
  await expect(page).toHaveURL(/mi-perfil\/editar$/)

  // El correo a la primera: sin el número, sin nada de la segunda, con un enlace común a su perfil.
  const subject = 'Tu teléfono quedó sin verificar'
  await expect.poll(() => hasMail(ana.email, subject)).toBe(true)
  const mail = mailTo(ana.email, subject)
  const national = phone.typed.replaceAll(' ', '')
  for (const secret of [phone.e164, phone.typed, national, bea.email, bea.name]) {
    expect(mail.text).not.toContain(secret)
    expect(mail.html).not.toContain(secret)
  }
  expect(mail.text).toContain(todayLabel())
  const links = [...mail.html.matchAll(/href="([^"]+)"/g)].map((match) => match[1] ?? '')
  expect(links.length).toBeGreaterThan(0)
  for (const link of links) expect(new URL(link).pathname).toBe('/mi-perfil')
  expect(mail.text).not.toMatch(/token|auth\/confirm/)

  // La primera vuelve a entrar y ve el aviso, con el día y sin nada de la segunda.
  await page.context().clearCookies()
  await page.goto('/mi-perfil')
  await expect(page).toHaveURL(/entrar/)
  await signInWithLink(page, ana.email)
  await expect(page).toHaveURL(/mi-perfil/)
  await expect(page.getByText('Sin verificar', { exact: true })).toBeVisible()
  await expect(page.getByText(/otra cuenta demostró tener tu número/i)).toBeVisible()
  await expect(page.getByText(todayLabel(), { exact: false })).toBeVisible()
  await expect(page.getByText(bea.name)).toHaveCount(0)
  await expect(page.getByText(phone.typed)).toHaveCount(0)
})
