import { expect, test, type Page } from '@playwright/test'
import { codeFor, linkFor } from './support/mailbox'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// El flujo crítico de la historia #10, de punta a punta y contra el build de producción: alguien
// sin sesión toca «publicar», ingresa, completa el perfil, verifica su teléfono con el código que
// le llegó y vuelve a la acción que había tocado (SC-007). En el camino se miden las dos pantallas
// de la verificación como las ve un teléfono (SC-008).
test.describe.configure({ mode: 'serial' })

const GATE = '/verificar-telefono?para=publicar&next=%2Fmi-perfil%2Feditar'

function uniqueEmail(): string {
  return `prueba+${crypto.randomUUID()}@example.test`
}

// Un celular por corrida, al azar: las pruebas comparten la base y cada número tiene su tope.
function uniqueNumber(): { typed: string; e164: string } {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const second = 1 + Math.floor(Math.random() * 9)
  return {
    typed: `09${second} ${rest.slice(0, 3)} ${rest.slice(3)}`,
    e164: `+5989${second}${rest}`,
  }
}

async function openEmailSignIn(page: Page) {
  const fallback = page.getByText(/prefiero entrar con mi correo/i)
  if (await fallback.isVisible()) await fallback.click()
}

async function expectPhoneLike(page: Page) {
  const vitals = await vitalsOf(page)
  expect(vitals.lcp, 'LCP en milisegundos').toBeLessThan(2500)
  expect(vitals.cls, 'corrimiento acumulado').toBeLessThan(0.05)
}

test('sin sesión, la puerta de publicar lleva a ingresar, verificar y volver a la acción', async ({
  page,
}) => {
  const email = uniqueEmail()
  const phone = uniqueNumber()

  // Sin sesión, la puerta pide ingresar primero, sin perder a dónde iba (FR-013c).
  await page.goto(GATE)
  await expect(page).toHaveURL(/entrar/)
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)

  await page.goto(linkFor(email))
  await expect(page).toHaveURL(/completar-perfil/)

  await page.getByRole('textbox').first().fill('Marta Suárez')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Salto' }).click()
  await page.getByRole('combobox').last().fill('Salto')
  await page.getByRole('button', { name: /guardar/i }).click()

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

  await page.goto('/mi-perfil')
  await expect(page.getByText('Verificado', { exact: true })).toBeVisible()
  await expect(page.getByText(phone.typed)).toBeVisible()
})
