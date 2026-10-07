import { expect, test, type Page } from '@playwright/test'
import { codeFor, linkFor, waitForLinkFor } from './support/mailbox'
import { service } from './support/pet-owner'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'

// Los flujos críticos de la historia #119 contra el build de producción: el destino con el que se
// pidió un enlace sobrevive a «El enlace no sirve» y el enlace nuevo lleva ahí, no a Mi perfil.
// En serie: comparten la base y el buzón.
test.describe.configure({ mode: 'serial' })

const PUBLISH = /\/mis-animales\/publicar$/

function randomPhone(): { typed: string; e164: string } {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return { typed: `091 ${rest.slice(0, 3)} ${rest.slice(3)}`, e164: `+59891${rest}` }
}

async function removeAccount(email: string): Promise<void> {
  const users = await service().auth.admin.listUsers({ perPage: 1000 })
  const id = users.data.users.find((user) => user.email === email)?.id
  if (id !== undefined) await service().auth.admin.deleteUser(id)
}

async function completeProfile(page: Page): Promise<void> {
  await page.getByRole('textbox').first().fill('Valeria Prueba')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Canelones' }).click()
  await page.getByRole('combobox').last().fill('Pando')
  await page.getByRole('button', { name: /guardar/i }).click()
}

async function verifyPhone(page: Page): Promise<void> {
  const phone = randomPhone()
  await expect(page.getByRole('button', { name: /mandarme el código/i })).toBeEnabled()
  await page.getByRole('textbox').fill(phone.typed)
  await page.getByRole('button', { name: /mandarme el código/i }).click()
  await expect(page).toHaveURL(/verificar-telefono\/codigo/)
  await expect(page.getByRole('button', { name: /^verificar$/i })).toBeEnabled()
  await page.getByRole('textbox').fill(codeFor(phone.e164))
  await page.getByRole('button', { name: /^verificar$/i }).click()
}

// Covers: US1-AS1, US1-AS2, US1-AS4, US1-AS8
test('«Enviarme otro enlace» desde un enlace ya usado lleva a publicar, no a Mi perfil', async ({
  page,
  browser,
}) => {
  const email = uniqueEmail()
  // El otro contexto es otra ventana: prueba que el destino viaja con el enlace y no con el
  // navegador, y su minuto de espera entre pedidos arranca de cero.
  const other = await browser.newContext()
  try {
    await page.goto('/')
    await page.getByRole('link', { name: 'Publicar un animal' }).click()
    await expect(page).toHaveURL(/\/entrar\?next=%2Fmis-animales%2Fpublicar/)

    await openEmailSignIn(page)
    await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
    await page.getByRole('textbox').fill(email)
    await page.getByRole('button', { name: /enlace/i }).click()
    await expect(page).toHaveURL(/revisa-tu-correo/)
    const first = await waitForLinkFor(email)
    await page.goto(first)
    await expect(page).toHaveURL(/completar-perfil/)

    const window = await other.newPage()
    await window.goto(first)
    await expect(window).toHaveURL(
      /\/entrar\/enlace\?motivo=consumed&link=[^&]+&next=%2Fmis-animales%2Fpublicar$/,
    )
    await expect(
      window.getByRole('heading', { level: 1, name: 'El enlace no sirve' }),
    ).toBeVisible()
    await expect(window.getByRole('main')).not.toContainText('publicar')
    await window.getByRole('button', { name: 'Enviarme otro enlace' }).click()
    await expect(window.getByRole('heading', { level: 1, name: 'Enlace en camino' })).toBeVisible()

    await expect.poll(() => linkFor(email)).not.toBe(first)
    const fresh = new URL(linkFor(email))
    expect(fresh.searchParams.get('next')).toBe('/mis-animales/publicar')

    await window.goto(fresh.toString())
    await expect(window).toHaveURL(/completar-perfil\?next=%2Fmis-animales%2Fpublicar/)
    await completeProfile(window)

    await expect(window).toHaveURL(/verificar-telefono\?para=publicar/)
    await verifyPhone(window)

    await expect(window).toHaveURL(PUBLISH)
    await expect(
      window.getByRole('heading', { level: 1, name: 'Publicar un animal' }),
    ).toBeVisible()
  } finally {
    await other.close()
    await removeAccount(email)
  }
})
