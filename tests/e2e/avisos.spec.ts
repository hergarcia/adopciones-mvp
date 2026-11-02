import { expect, test } from '@playwright/test'
import { requireEnv } from '../../src/lib/env'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { mailsTo, waitForLinkFor } from './support/mailbox'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import { openEmailSignIn } from './support/sign-in'

// El flujo crítico de la historia #265 contra el build de producción: sin sesión, pedir el aviso
// desde un listado filtrado sin resultados, entrar con el enlace del correo y volver al mismo
// listado con el aviso creado; verlo en «Mis avisos» con su nombre y borrarlo. Después, el correo de
// la corrida de las 8 y su «Dejar de recibir», sin sesión.

// Una combinación que ninguna otra prueba publica: el listado queda vacío. Lleva también «Solo de
// quien verificó su identidad» (#285, FR-013, FR-015), que viaja de ida y vuelta con los demás.
const FILTERED =
  '/animales?especie=gato&sexo=hembra&tamano=grande&edad=mayor&departamento=artigas&castrado=si&quien-publica=identidad'
const OFFER = 'Avisame cuando haya uno así'

let bruno: Person

test.beforeEach(async () => {
  bruno = await newPerson('Bruno', { level: 1 })
})

test.afterEach(async () => {
  await removePerson(bruno)
})

// Covers: US1-AS1, US1-AS3, US1-AS6, US1-AS10, US1-AS11, SC-001; #285 FR-013, FR-015
test('sin sesión pide el aviso, entra y vuelve con el aviso creado', async ({ page }) => {
  await page.goto(FILTERED)
  await expect(page.getByText('No hay animales con estos filtros.')).toBeVisible()
  // Hidratado, «Sacar los filtros» pasa de enlace a botón: un toque antes se pierde en el medio.
  await expect(page.getByRole('button', { name: 'Sacar los filtros' })).toBeVisible()

  await page.getByRole('link', { name: OFFER }).click()
  await expect(page).toHaveURL(/entrar/)
  // #267: la pantalla de entrar le dice para qué entra.
  await expect(
    page.getByText('Al entrar volvés al listado con el aviso ya guardado.'),
  ).toBeVisible()
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
  await expect(
    page.getByText('Gatas grandes mayores castradas en Artigas, de quien verificó su identidad'),
  ).toBeVisible()
  const toListing = page.getByRole('link', { name: 'Ver en el listado' })
  await expect(toListing).toHaveAttribute('href', FILTERED)
  await toListing.click()
  await expect(
    page.getByRole('checkbox', { name: 'Solo de quien verificó su identidad' }),
  ).toBeChecked()
  await page.goBack()
  await expect(page).toHaveURL(/mis-avisos/)

  await page.getByRole('button', { name: 'Borrar' }).click()
  await expect(page.getByRole('heading', { name: 'No tenés avisos' })).toBeVisible()
})

// Historia #287: con los filtros marcados en la página y no en el enlace, la respuesta también se
// queda en el lugar del botón, y cambiar un filtro vuelve a ofrecer.
// Covers: #287 US3-AS1, US3-AS5, FR-016, FR-017, FR-019
test('con filtros marcados en la página, la confirmación se queda', async ({ page }) => {
  await signIn(page, bruno.email, '/animales')
  await expect(page).toHaveURL(/\/animales$/)
  await expect(page.getByRole('button', { name: 'Sacar los filtros' })).toHaveCount(0)

  const listed = page.waitForResponse((response) =>
    response.url().includes('/api/animales?especie=perro&quien-publica=identidad'),
  )
  await page.locator('label', { hasText: /^Perro$/ }).click()
  await page.locator('label', { hasText: /^Solo de quien verificó su identidad$/ }).click()
  await listed
  await expect(page).toHaveURL(/\/animales\?especie=perro&quien-publica=identidad$/)

  await page.getByRole('button', { name: OFFER }).click()
  const confirmation = page.getByText('Te vamos a avisar por correo.')
  await expect(confirmation).toBeVisible()
  // Lo que borraba la confirmación llegaba con la respuesta del servidor, después de dibujarla.
  await page.waitForLoadState('networkidle')
  await expect(confirmation).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mis avisos' })).toBeVisible()
  await expect(page.getByRole('button', { name: OFFER })).toHaveCount(0)

  await page.locator('label', { hasText: /^Chico$/ }).click()
  await expect(page.getByRole('button', { name: OFFER })).toBeVisible()
  await expect(confirmation).toHaveCount(0)

  // El enlace del correo entra por el origen de `APP_URL`: la sesión vive ahí, no en `baseURL`.
  await page.goto(new URL('/mis-avisos', page.url()).href)
  await expect(page.getByText('Perros, de quien verificó su identidad')).toBeVisible()
})

const ALERT_MAIL = /como (el|los) que buscás$/u
const UNSUBSCRIBE_LINK = /https?:\/\/\S+?(\/dejar-de-recibir\/[A-Za-z0-9_-]{43})/

// Covers: US3-AS1, US3-AS2, US3-AS3, FR-022, FR-026, FR-027, FR-028, SC-005
test('«Dejar de recibir» del correo corta los avisos sin entrar', async ({ page, request }) => {
  test.setTimeout(120_000)
  const alert = await service()
    .from('pet_alerts')
    .insert({ user_id: bruno.id, species: ['cat'], departments: ['UY-RV'] })
  expect(alert.error).toBeNull()
  // Publicado después del aviso: es lo nuevo que trae el correo de mañana.
  const run = await publishForRun([
    { name: 'Mora', species: 'cat', department: 'UY-RV', locality: 'Rivera' },
  ])
  try {
    const tick = await request.post('/api/cron/resumen', {
      headers: { 'x-cron-secret': requireEnv('CRON_SECRET') },
    })
    expect(tick.status()).toBe(204)
    await expect.poll(() => mailsTo(bruno.email, ALERT_MAIL).length, { timeout: 30_000 }).toBe(1)
    const [mail] = mailsTo(bruno.email, ALERT_MAIL)
    const path = UNSUBSCRIBE_LINK.exec(mail?.text ?? '')?.[1] ?? ''
    expect(path).not.toBe('')

    await page.goto(path)
    const done = page.getByRole('heading', { name: 'Listo, no te vamos a mandar más avisos' })
    await expect(done).toBeVisible()
    await page.reload()
    await expect(done).toBeVisible()

    const altered = `${path.slice(0, -1)}${path.endsWith('A') ? 'B' : 'A'}`
    await page.goto(altered)
    await expect(page.getByRole('heading', { name: 'Este enlace no sirve' })).toBeVisible()

    await signIn(page, bruno.email, '/mis-avisos')
    await expect(page.getByRole('heading', { name: 'No tenés avisos' })).toBeVisible()
  } finally {
    await removeRunOwner(run.owner.id)
  }
})
