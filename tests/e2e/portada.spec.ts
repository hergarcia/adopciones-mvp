import { expect, test, type Page } from '@playwright/test'
import { APP_NAME } from '../../src/lib/config'
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
