import { expect, test, type Page } from '@playwright/test'
import { codeFor, hasMail, linkFor } from './support/mailbox'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// El flujo crítico de la historia #11, de punta a punta y contra el build de producción: una
// persona sin teléfono pide la verificación de identidad, pasa por la puerta del teléfono y vuelve,
// acepta el consentimiento, sube las dos fotos y ve su pedido en revisión; Lucía, que administra,
// lo aprueba desde la cola; la persona ve su nivel 2 y le llegó el correo. En el camino se mide la
// pantalla de pedir como la ve un teléfono (SC-010).
test.describe.configure({ mode: 'serial' })

const ADMIN = 'lucia@example.test'

// Una persona por corrida: las pruebas comparten la base, y un pedido abierto de otra corrida
// dejaría a la persona sembrada sin poder pedir.
function uniqueName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const suffix = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 26)]).join('')
  return `Rocío ${suffix}`
}

function uniqueNumber() {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const second = 1 + Math.floor(Math.random() * 9)
  return {
    typed: `09${second} ${rest.slice(0, 3)} ${rest.slice(3)}`,
    e164: `+5989${second}${rest}`,
  }
}

async function signInWithLink(page: Page, email: string) {
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await page.goto(linkFor(email))
}

// Covers: US1-AS1..AS4, US1-AS8, US2-AS1..AS4, FR-002, FR-003, FR-026, SC-010
test('pedir la verificación, que Lucía la apruebe y ver el nivel 2', async ({ page, browser }) => {
  const email = uniqueEmail()
  const name = uniqueName()
  const phone = uniqueNumber()

  // Sin sesión, la pantalla pide ingresar sin perder a dónde iba; con el perfil completo y sin
  // teléfono, la puerta del teléfono nombra la acción (FR-002).
  await page.goto('/verificar-identidad')
  await expect(page).toHaveURL(/entrar/)
  await signInWithLink(page, email)
  await expect(page).toHaveURL(/completar-perfil/)
  await page.getByRole('textbox').first().fill(name)
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Salto' }).click()
  await page.getByRole('combobox').last().fill('Salto')
  await page.getByRole('button', { name: /guardar/i }).click()

  await expect(page).toHaveURL(/verificar-telefono\?para=identidad/)
  await expect(page.getByRole('heading', { name: /para verificar tu identidad/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /mandarme el código/i })).toBeEnabled()
  await page.getByRole('textbox').fill(phone.typed)
  await page.getByRole('button', { name: /mandarme el código/i }).click()
  await expect(page.getByRole('button', { name: /^verificar$/i })).toBeEnabled()
  await page.getByRole('textbox').fill(codeFor(phone.e164))
  await page.getByRole('button', { name: /^verificar$/i }).click()

  // Al verificar, de vuelta a pedir la identidad. La pantalla se mide como en un teléfono.
  await expect(page).toHaveURL(/verificar-identidad/)
  await throttleLikeAPhone(page)
  await page.reload()
  const accept = page.getByRole('button', { name: 'Acepto y elijo las fotos' })
  await expect(page.getByText(/nadie más ve nunca tu documento/i)).toBeVisible()
  await expect(accept).toBeEnabled()
  const vitals = await vitalsOf(page)
  expect(vitals.lcp, 'LCP en milisegundos').toBeLessThan(2500)
  expect(vitals.cls, 'corrimiento acumulado').toBeLessThan(0.05)

  // Sin aceptar no hay dónde elegir fotos (FR-003).
  await expect(page.getByRole('button', { name: 'Elegir foto' })).toHaveCount(0)
  await accept.click()

  const files = page.locator('input[type="file"]:not([capture])')
  await files.nth(0).setInputFiles('tests/e2e/support/cedula.png')
  await expect(page.getByRole('img', { name: /el frente de tu cédula/i })).toBeVisible()
  await files.nth(1).setInputFiles('tests/e2e/support/selfie.png')
  await expect(page.getByRole('img', { name: /tu selfie con la cédula/i })).toBeVisible()

  await page.getByRole('button', { name: 'Enviar mi pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Tu pedido está en revisión' })).toBeVisible()
  await expect(page.getByText('En revisión', { exact: true })).toBeVisible()

  // Lucía, en otra sesión, lo abre desde la cola y lo aprueba con las dos imágenes a la vista.
  const admin = await (await browser.newContext()).newPage()
  await admin.goto('/revision')
  await expect(admin).toHaveURL(/entrar/)
  await admin.waitForLoadState('networkidle')
  await signInWithLink(admin, ADMIN)
  await admin.goto(new URL('/revision', admin.url()).toString())
  await admin.getByRole('link', { name: new RegExp(name) }).click()
  await expect(admin.getByRole('heading', { name })).toBeVisible()
  await expect(admin.getByRole('img', { name: `Frente de la cédula de ${name}` })).toBeVisible()
  await expect(admin.getByRole('img', { name: `Selfie de ${name} con su cédula` })).toBeVisible()
  const opened = admin.url()
  await admin.getByRole('button', { name: 'Aprobar' }).click()
  await expect(admin).not.toHaveURL(opened)
  await admin.goto(new URL('/revision', admin.url()).toString())
  await expect(admin.getByRole('link', { name: new RegExp(name) })).toHaveCount(0)

  // La persona ve el sello «Verificada» y su nivel 2 en su perfil, y el correo del resultado salió (FR-024, FR-026).
  await page.goto(new URL('/mi-perfil', page.url()).toString())
  await expect(page.getByText('Verificada', { exact: true })).toBeVisible()
  await expect(page.getByText('Estás en nivel 2.', { exact: true })).toBeVisible()
  await expect(page.getByText(/nivel 1 desde/i)).toHaveCount(0)
  await expect
    .poll(() => hasMail(email, 'Tu identidad está verificada'), { timeout: 15_000 })
    .toBe(true)
})
