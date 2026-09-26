import { expect, test } from '@playwright/test'
import { waitForLinkFor } from './support/mailbox'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'

// El flujo crítico de la historia #9, de punta a punta y contra el build de producción: pedir el
// enlace, abrirlo, completar el perfil, verlo y cerrar sesión.
//
// De paso demuestra que `/auth/confirm` responde **fuera** del segmento de idioma. Sin la
// exclusión de `auth` en el matcher del proxy, next-intl lo reescribiría a /es/auth/confirm y el
// enlace del correo daría 404: es el defecto más caro que puede tener esta historia, porque nadie
// podría entrar, y en local pasa desapercibido hasta que alguien abre un correo de verdad.

// En serie, no en paralelo: las dos pruebas comparten una sola base y un solo buzón, y pedir un
// enlace invalida el anterior de esa dirección (FR-004). Correrlas a la vez no probaría el flujo,
// probaría la carrera.
test.describe.configure({ mode: 'serial' })

test('una persona sin cuenta entra por el enlace y completa su perfil', async ({ page }) => {
  const email = uniqueEmail()

  await page.goto('/entrar')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await openEmailSignIn(page)

  // Hidratado antes de tocar: sin esto el navegador haría el envío nativo del formulario y se
  // estaría probando otra cosa.
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()

  // La pantalla de espera dice a dónde se mandó, sin que la dirección viaje por la URL.
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await expect(page.getByText(email)).toBeVisible()
  expect(page.url()).not.toContain(email)

  await page.goto(await waitForLinkFor(email))

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

  // Editar y querer irse por un enlace nuestro: `beforeunload` no se entera de una navegación del
  // cliente, así que sin el aviso lo escrito se perdería en silencio (FR-023).
  await page.getByRole('link', { name: /editar mi perfil/i }).click()
  await expect(page).toHaveURL(/mi-perfil\/editar/)
  await expect(page.getByRole('button', { name: /guardar/i })).toBeEnabled()
  await page.getByRole('textbox').first().fill('Ana Beatriz García')
  await page.getByRole('link', { name: /mi perfil/i }).click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(/mi-perfil\/editar/)

  await page.getByRole('button', { name: /seguir editando/i }).click()
  await expect(page).toHaveURL(/mi-perfil\/editar/)
  await expect(page.getByRole('textbox').first()).toHaveValue('Ana Beatriz García')

  // Y quien decide salir, sale: el aviso pregunta, no encierra.
  await page.getByRole('link', { name: /mi perfil/i }).click()
  await page.getByRole('button', { name: /salir sin guardar/i }).click()
  await expect(page).toHaveURL(/mi-perfil$/)
  await expect(page.getByRole('heading', { name: 'Ana García' })).toBeVisible()

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
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)

  const link = await waitForLinkFor(email)
  await page.goto(link)
  await expect(page).toHaveURL(/completar-perfil/)

  // El mismo enlace otra vez: un reenvío, o volver atrás en el navegador.
  await page.context().clearCookies()
  await page.goto(link)

  await expect(page).toHaveURL(/entrar\/enlace/)
  await expect(page.getByText(/ya se usó/i)).toBeVisible()
  // La dirección no se muestra: el enlace pudo abrirlo alguien que no es su dueña.
  await expect(page.getByText(email)).toHaveCount(0)

  // Y tampoco aparece al tocar el único botón que hay. Antes esto llevaba a «Mirá tu correo»,
  // que la muestra entera: la pantalla estaba bien y su salida filtraba lo mismo que cuidaba.
  await page.getByRole('button', { name: /enviarme otro/i }).click()
  await expect(page.getByText(/te mandamos otro/i)).toBeVisible()
  await expect(page).toHaveURL(/entrar\/enlace/)
  await expect(page.getByText(email)).toHaveCount(0)
})
