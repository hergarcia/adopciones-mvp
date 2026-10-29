import { expect, test } from '@playwright/test'
import { waitForLinkFor } from './support/mailbox'
import { newPerson, removePerson, type Person } from './support/people'
import { openEmailSignIn } from './support/sign-in'

// El flujo crítico de la historia #265 contra el build de producción: sin sesión, pedir el aviso
// desde un listado filtrado sin resultados, entrar con el enlace del correo y volver al mismo
// listado con el aviso creado; verlo en «Mis avisos» con su nombre y borrarlo.

// Una combinación que ninguna otra prueba publica: el listado queda vacío.
const FILTERED =
  '/animales?especie=gato&sexo=hembra&tamano=grande&edad=mayor&departamento=artigas&castrado=si'
const OFFER = 'Avisame cuando haya uno así'

let bruno: Person

test.beforeEach(async () => {
  bruno = await newPerson('Bruno', { level: 1 })
})

test.afterEach(async () => {
  await removePerson(bruno)
})

// Covers: US1-AS1, US1-AS3, US1-AS6, US1-AS10, US1-AS11, SC-001
test('sin sesión pide el aviso, entra y vuelve con el aviso creado', async ({ page }) => {
  await page.goto(FILTERED)
  await expect(page.getByText('No hay animales con estos filtros.')).toBeVisible()
  // Hidratado, «Sacar los filtros» pasa de enlace a botón: un toque antes se pierde en el medio.
  await expect(page.getByRole('button', { name: 'Sacar los filtros' })).toBeVisible()

  await page.getByRole('link', { name: OFFER }).click()
  await expect(page).toHaveURL(/entrar/)
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(bruno.email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)
  await page.goto(await waitForLinkFor(bruno.email))

  // Vuelve al mismo listado, el aviso se crea solo y la marca sale de la dirección.
  await expect(page.getByText('Te vamos a avisar por correo.')).toBeVisible()
  await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === FILTERED)

  // Otra vez con los mismos filtros: ya lo tiene, y no se crea otro.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sacar los filtros' })).toBeVisible()
  await page.getByRole('button', { name: OFFER }).click()
  await expect(page.getByText('Ya tenés este aviso.')).toBeVisible()

  await page.getByRole('link', { name: 'Mis avisos' }).click()
  await expect(page).toHaveURL(/mis-avisos/)
  await expect(page.getByText('Gatas grandes mayores castradas en Artigas')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver en el listado' })).toHaveAttribute(
    'href',
    FILTERED,
  )

  await page.getByRole('button', { name: 'Borrar' }).click()
  await expect(page.getByRole('heading', { name: 'No tenés avisos' })).toBeVisible()
})
