import { expect, test, type Page } from '@playwright/test'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

// Covers: US2-AS1, US2-AS6, US2-AS7, US2-AS9, FR-019, FR-020. El flujo crítico de la historia #13
// (plan §Flujo crítico): Marta reporta a Ana, Lucía la suspende desde el reporte, Ana —con la sesión
// abierta desde antes y sin recargar— cae en su pantalla al navegar, su animal deja de verse, y al
// reactivarla vuelve con el mismo enlace. Todas las personas son de la corrida: el seed no cambia.
test('reportar, suspender y reactivar', async ({ page, browser }) => {
  test.setTimeout(180_000)
  const run = crypto.randomUUID().slice(0, 8)
  const reason = `Ofrecía cachorros a la venta (${run})`
  // Las pruebas que corren a la vez publican en el año 2999 (`publishForRun`) y la camada de 26 de
  // animales.spec empujaba a Firulais fuera de la primera página: un departamento que ninguna otra
  // usa lo deja ahí.
  const { owner: ana, pets } = await publishForRun([
    { name: `Firulais ${run}`, species: 'dog', department: 'UY-DU', locality: 'Durazno' },
  ])
  const [pet] = pets
  const petPath = `/animales/${pet?.code ?? ''}`
  const marta = await newPerson('Marta Prueba', { level: 1 })
  const lucia = await newPerson('Lucía Prueba', { level: 1 })
  const { data: profile } = await service()
    .from('profiles')
    .select('public_id')
    .eq('id', ana.id)
    .single()
  const anaPath = `/perfil/${String(profile?.public_id ?? '')}`
  expect((await service().from('admins').insert({ user_id: lucia.id })).error).toBeNull()

  const martaContext = await browser.newContext()
  const luciaContext = await browser.newContext()
  const visitorContext = await browser.newContext()
  try {
    // Ana entra antes de todo y se queda en el listado, sin recargar.
    await signIn(page, ana.email, '/animales?departamento=durazno')
    const anaCard = page.getByRole('link', { name: new RegExp(`Firulais ${run}`) })
    await expect(anaCard).toBeVisible()

    const martaPage = await martaContext.newPage()
    await signIn(martaPage, marta.email, anaPath)
    await martaPage.getByRole('button', { name: 'Reportar', exact: true }).click()
    const sheet = martaPage.getByRole('dialog', { name: 'Reportar a Ana Prueba' })
    await sheet.getByRole('radio', { name: 'Vende animales' }).check()
    await sheet.getByRole('button', { name: 'Enviar reporte' }).click()
    await expect(martaPage.getByRole('dialog', { name: 'Recibimos tu reporte' })).toBeVisible()

    const luciaPage = await luciaContext.newPage()
    await signIn(luciaPage, lucia.email, '/revision/reportes')
    // En Reportes, el nombre de la reportada lleva a su ficha (historia #73), no a su perfil.
    const item = luciaPage.getByRole('article').filter({
      has: luciaPage.locator(
        `a[href="/administrar/personas/${String(profile?.public_id ?? '')}?desde=reportes"]`,
      ),
    })
    await expect(item.getByRole('heading', { name: 'Vende animales' })).toBeVisible()
    await item.getByRole('button', { name: 'Suspender', exact: true }).click()
    const suspend = luciaPage.getByRole('dialog', { name: 'Suspender a Ana Prueba' })
    await suspend.getByRole('textbox', { name: 'Motivo' }).fill(reason)
    await suspend.getByRole('button', { name: 'Suspender', exact: true }).click()
    // La acción manda el correo antes de responder.
    await expect(luciaPage.getByText('Suspendiste a Ana Prueba', { exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(item).toHaveCount(0)

    // La sesión de antes, sin recargar: lo próximo que abre la lleva a su pantalla.
    await anaCard.click()
    await expect(page).toHaveURL(/\/cuenta-suspendida$/)
    await expect(page.getByRole('heading', { name: 'Tu cuenta está suspendida' })).toBeVisible()
    await expect(page.getByText(`«${reason}»`)).toBeVisible()

    // Covers: US2-AS6 (#8), SC-007. Las preguntas también la traen acá, y su pie no las ofrece.
    await expectSuspendedAt(page, '/preguntas')
    await expectSuspendedAt(page, '/preguntas/como-se-verifica')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Opinar', exact: true })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Preguntas y respuestas' })).toHaveCount(0)

    const visitor = await visitorContext.newPage()
    await visitor.goto(petPath)
    await expect(
      visitor.getByRole('heading', { name: 'Este animal no está publicado' }),
    ).toBeVisible()
    await visitor.goto('/animales')
    await expect(visitor.getByText(`Firulais ${run}`)).toHaveCount(0)

    // El enlace del correo deja la sesión en el dominio de APP_URL, que no es el de `baseURL`.
    await luciaPage.goto(new URL('/revision/suspendidas', luciaPage.url()).toString())
    const row = luciaPage.getByRole('article').filter({ hasText: reason })
    await row.getByRole('button', { name: 'Reactivar' }).click()
    const reactivate = luciaPage.getByRole('dialog', { name: '¿Reactivar a Ana Prueba?' })
    await reactivate.getByRole('button', { name: 'Reactivar' }).click()
    await expect(
      luciaPage.getByText('Ana Prueba puede volver a usar el sitio', { exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    })

    await visitor.goto(petPath)
    await expect(visitor.getByRole('heading', { level: 1, name: `Firulais ${run}` })).toBeVisible()
  } finally {
    await Promise.all([martaContext.close(), luciaContext.close(), visitorContext.close()])
    await Promise.all([removeRunOwner(ana.id), removePerson(marta), removePerson(lucia)])
  }
})

// En el host de la sesión, que es el de APP_URL y no el de `baseURL`.
async function expectSuspendedAt(page: Page, path: string) {
  await page.goto(new URL(path, page.url()).toString())
  await expect(page).toHaveURL(/\/cuenta-suspendida$/)
  await expect(page.getByRole('heading', { name: 'Tu cuenta está suspendida' })).toBeVisible()
}
