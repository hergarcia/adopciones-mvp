import { expect, test, type Browser, type Page } from '@playwright/test'
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

// Del ingreso con enlace hasta la pantalla de pedir: perfil completo y teléfono verificado, que es
// la puerta de la verificación de identidad (FR-002).
async function reachIdentityRequest(page: Page, email: string, name: string) {
  const phone = uniqueNumber()
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
  await expect(page).toHaveURL(/verificar-identidad/)
}

async function sendPhotos(page: Page) {
  const files = page.locator('input[type="file"]:not([capture])')
  await files.nth(0).setInputFiles('tests/e2e/support/cedula.png')
  await expect(page.getByRole('img', { name: /el frente de tu cédula/i })).toBeVisible()
  await files.nth(1).setInputFiles('tests/e2e/support/selfie.png')
  await expect(page.getByRole('img', { name: /tu selfie con la cédula/i })).toBeVisible()

  await page.getByRole('button', { name: 'Enviar mi pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Tu pedido está en revisión' })).toBeVisible()
  await expect(page.getByText('En revisión', { exact: true })).toBeVisible()
}

// Lucía, en otra sesión, abre el pedido desde la cola con las dos imágenes a la vista.
async function openAsAdmin(browser: Browser, name: string): Promise<Page> {
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
  return admin
}

// Covers: US1-AS1..AS4, US1-AS8, US2-AS1..AS4, FR-002, FR-003, FR-026, SC-010
test('pedir la verificación, que Lucía la apruebe y ver el nivel 2', async ({ page, browser }) => {
  const email = uniqueEmail()
  const name = uniqueName()

  await reachIdentityRequest(page, email, name)

  // La pantalla de pedir se mide como en un teléfono.
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
  await sendPhotos(page)

  const admin = await openAsAdmin(browser, name)
  const opened = admin.url()
  await admin.getByRole('button', { name: 'Aprobar' }).click()
  await expect(admin).not.toHaveURL(opened)
  await admin.goto(new URL('/revision', admin.url()).toString())
  await expect(admin.getByRole('link', { name: new RegExp(name) })).toHaveCount(0)

  // La persona ve el sello «Verificada» y su nivel 2 en su perfil, y el correo del resultado salió (FR-024, FR-026).
  await page.goto(new URL('/mi-perfil', page.url()).toString())
  await expect(page.getByText('Verificada', { exact: true })).toBeVisible()
  await expect(page.getByText(/^Estás en nivel 2: quien te da o te pide un animal/)).toBeVisible()
  await expect(page.getByText(/nivel 1 desde/i)).toHaveCount(0)
  await expect
    .poll(() => hasMail(email, 'Tu identidad está verificada'), { timeout: 15_000 })
    .toBe(true)
})

// Covers: FR-005, FR-008a. Safari y todo iOS no exportan WebP desde canvas: devuelven PNG en
// silencio. Acá se reproduce eso en Chromium, y las fotos tienen que salir en JPEG y llegar igual.
test('desde un navegador que no exporta WebP, el pedido llega en JPEG', async ({
  page,
  browser,
}) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line typescript/unbound-method -- se guarda para llamarlo con el `this` de cada canvas.
    const toBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      toBlob.call(this, callback, type === 'image/webp' ? 'image/png' : type, quality)
    }
  })
  const name = uniqueName()

  await reachIdentityRequest(page, uniqueEmail(), name)
  await page.getByRole('button', { name: 'Acepto y elijo las fotos' }).click()
  await sendPhotos(page)

  const admin = await openAsAdmin(browser, name)
  const selfie = admin.getByRole('img', { name: `Selfie de ${name} con su cédula` })
  const source = await selfie.getAttribute('src')
  expect(source).not.toBeNull()
  const served = await admin.request.get(new URL(source ?? '', admin.url()).toString())
  expect(served.headers()['content-type']).toBe('image/jpeg')
  await expect
    .poll(() => selfie.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
})
