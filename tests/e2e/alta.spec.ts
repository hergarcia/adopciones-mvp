import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// El flujo crítico de la historia #9, de punta a punta y contra el build de producción: pedir el
// enlace, abrirlo, completar el perfil, verlo y cerrar sesión.
//
// De paso demuestra que `/auth/confirm` responde **fuera** del segmento de idioma. Sin la
// exclusión de `auth` en el matcher del proxy, next-intl lo reescribiría a /es/auth/confirm y el
// enlace del correo daría 404: es el defecto más caro que puede tener esta historia, porque nadie
// podría entrar, y en local pasa desapercibido hasta que alguien abre un correo de verdad.
const MAIL_DIR = '.artifacts/mail'

// En serie, no en paralelo: las dos pruebas comparten una sola base y un solo buzón, y pedir un
// enlace invalida el anterior de esa dirección (FR-004). Correrlas a la vez no probaría el flujo,
// probaría la carrera.
test.describe.configure({ mode: 'serial' })

function uniqueEmail(): string {
  return `prueba+${crypto.randomUUID()}@example.test`
}

type Message = { to: string; text: string }

// El buzón es un archivo que escribe el propio producto, pero para el compilador es JSON: se lee
// campo por campo en vez de afirmar la forma de un golpe.
function readMessage(path: string): Message {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null) return { to: '', text: '' }

  const record: Record<string, unknown> = { ...parsed }
  const to = record['to']
  const text = record['text']
  return {
    to: typeof to === 'string' ? to : '',
    text: typeof text === 'string' ? text : '',
  }
}

// Se busca por destinatario y no «el último»: las pruebas corren en paralelo y comparten el buzón,
// así que vaciarlo o quedarse con el más nuevo haría que una se lleve el correo de la otra.
function linkFor(email: string): string {
  const messages = readdirSync(MAIL_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readMessage(join(MAIL_DIR, name)))
    .filter((message) => message.to === email)

  const mine = messages.at(-1)
  expect(mine, `el producto tiene que haber escrito el correo a ${email}`).toBeDefined()

  const url = /https?:\/\/\S+\/auth\/confirm\S*/.exec(mine!.text)?.[0]
  expect(url, 'el correo tiene que traer el enlace').toBeDefined()

  return url!
}

test('una persona sin cuenta entra por el enlace y completa su perfil', async ({ page }) => {
  const email = uniqueEmail()

  await page.goto('/entrar')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Hidratado antes de tocar: sin esto el navegador haría el envío nativo del formulario y se
  // estaría probando otra cosa.
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()

  // La pantalla de espera dice a dónde se mandó, sin que la dirección viaje por la URL.
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await expect(page.getByText(email)).toBeVisible()
  expect(page.url()).not.toContain(email)

  await page.goto(linkFor(email))

  // Abrir el enlace lleva a completar el perfil, no a una pantalla vacía ni a un 404.
  await expect(page).toHaveURL(/completar-perfil/)

  await page.getByRole('textbox').first().fill('Ana García')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Montevideo' }).click()

  // En Montevideo la etiqueta del segundo campo dice «Barrio», no «Localidad».
  await expect(page.getByText('Barrio', { exact: true })).toBeVisible()

  const locality = page.getByRole('combobox').last()
  await locality.fill('pocit')
  await page.getByRole('option', { name: 'Pocitos' }).click()

  await page.getByRole('button', { name: /guardar/i }).click()

  await expect(page).toHaveURL(/mi-perfil/)
  await expect(page.getByRole('heading', { name: 'Ana García' })).toBeVisible()
  await expect(page.getByText('Pocitos, Montevideo')).toBeVisible()
  // El correo se ve, y solo acá: es la pantalla de su dueña.
  await expect(page.getByText(email)).toBeVisible()

  await page.getByRole('button', { name: /cerrar sesión/i }).click()
  await expect(page).toHaveURL(/\/$/)

  // Sin sesión, la pantalla privada deja de estar disponible.
  await page.goto('/mi-perfil')
  await expect(page).toHaveURL(/entrar/)
})

test('un enlace que ya se usó lo dice, y deja pedir otro sin mostrar la dirección', async ({
  page,
}) => {
  const email = uniqueEmail()

  await page.goto('/entrar')
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)

  const link = linkFor(email)
  await page.goto(link)
  await expect(page).toHaveURL(/completar-perfil/)

  // El mismo enlace otra vez: un reenvío, o volver atrás en el navegador.
  await page.context().clearCookies()
  await page.goto(link)

  await expect(page).toHaveURL(/entrar\/enlace/)
  await expect(page.getByText(/ya se usó/i)).toBeVisible()
  // La dirección no se muestra: el enlace pudo abrirlo alguien que no es su dueña.
  await expect(page.getByText(email)).toHaveCount(0)
})
