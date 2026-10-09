import { expect, test } from '@playwright/test'
import { requireEnv } from '../../src/lib/env'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { mailsTo } from './support/mailbox'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'

// Los dos flujos críticos de la historia #73 (plan §Qué se testea) y el resumen por la ruta de la
// tarea. Todas las personas, los reportes y los animales son de la corrida: el seed no cambia. Las
// colas son de toda la base y otras pruebas suman en paralelo, así que ningún número se compara
// exacto.

async function makeAdmin(person: { id: string }): Promise<void> {
  expect((await service().from('admins').insert({ user_id: person.id })).error).toBeNull()
}

async function seedReport(reporter: Person, reported: Person, details: string): Promise<void> {
  const { error } = await service().from('reports').insert({
    reporter_id: reporter.id,
    reported_id: reported.id,
    reason: 'sells_animals',
    details,
  })
  expect(error).toBeNull()
}

// Covers: US1-AS2, US1-AS3, US1-AS5, US2-AS1, US2-AS3, FR-013, FR-020, FR-023, FR-040
test('desde el menú a Administrar, de Reportes a la ficha de la reportada y suspenderla', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const run = crypto.randomUUID().slice(0, 8)
  const pet = `Tobi ${run}`
  const details = `Publicó tres cachorros con precio (${run})`
  const reason = `Vendía cachorros (${run})`
  const { owner: admin } = await publishForRun([{ name: pet, species: 'dog' }])
  await makeAdmin(admin)
  const marta = await newPerson('Marta Prueba', { level: 1 })
  const bruno = await newPerson(`Bruno ${run}`, { level: 1 })
  try {
    await seedReport(marta, bruno, details)
    await signIn(page, admin.email, '/mi-perfil')

    const menu = page.getByRole('link', { name: /^Administrar, \d+ pendientes?$/u })
    await expect(menu.getByText(/^Administrar \(\d+\+?\)$/u)).toBeVisible()
    await menu.click()
    await expect(page.getByRole('heading', { level: 1, name: 'Administrar' })).toBeVisible()
    await expect(
      page.getByText(`Tu publicación de ${pet}, desde hace menos de 1 hora.`),
    ).toBeVisible()

    const reports = page.getByRole('link', { name: /^Reportes sin resolver/u })
    await expect(reports).toContainText(/\d+ esperando, el más viejo de hace/u)
    await reports.click()
    await expect(page.getByRole('heading', { level: 1, name: 'Reportes' })).toBeVisible()
    await page.getByRole('link', { name: 'Volver a Administrar' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Administrar' })).toBeVisible()

    await page.getByRole('link', { name: /^Reportes sin resolver/u }).click()
    const item = page.getByRole('article').filter({ hasText: details })
    await item.getByRole('link', { name: `Bruno ${run}`, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: `Bruno ${run}` })).toBeVisible()
    await expect(page.getByText(`«${details}»`)).toBeVisible()

    await page.getByRole('button', { name: 'Suspender', exact: true }).click()
    const sheet = page.getByRole('dialog', { name: `Suspender a Bruno ${run}` })
    await sheet.getByRole('textbox', { name: 'Motivo' }).fill(reason)
    await sheet.getByRole('button', { name: 'Suspender', exact: true }).click()
    // La acción manda el correo antes de responder.
    await expect(page.getByText(`Suspendiste a Bruno ${run}`, { exact: true })).toBeVisible({
      timeout: 15_000,
    })
    const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) })
    await expect(header.getByText('Suspendida', { exact: true })).toBeVisible()
    await expect(header.getByText(`«${reason}»`)).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Suspensiones' }).getByText(`«${reason}»`),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reactivar' })).toBeVisible()
  } finally {
    await Promise.all([removeRunOwner(admin.id), removePerson(marta), removePerson(bruno)])
  }
})

// Covers: US4-AS2, US4-AS5, US1-AS11, FR-001, FR-050, FR-051
test('buscar por nombre sin tildes abre la ficha, y quien no administra no ve Administrar', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000)
  const run = crypto.randomUUID().slice(0, 8)
  const name = `Ana Pérez ${run}`
  const admin = await newPerson('Lucía Prueba', { level: 1 })
  await makeAdmin(admin)
  const first = await newPerson(name, { level: 1 })
  const second = await newPerson(name, { level: 0 })
  const visitorContext = await browser.newContext()
  try {
    await signIn(page, admin.email, '/administrar')
    const field = page.getByRole('searchbox', { name: 'Nombre' })
    await field.fill('an')
    await page.getByRole('button', { name: 'Buscar' }).click()
    await expect(page.getByText('Escribí al menos 3 letras.')).toBeVisible()
    await expect(field).toHaveValue('an')

    await field.fill(`ana perez ${run}`)
    await page.getByRole('button', { name: 'Buscar' }).click()
    const results = page.getByRole('list', { name: 'Personas con ese nombre' })
    await expect(results.getByRole('link')).toHaveCount(2)
    await results.getByRole('link').first().click()
    await expect(page).toHaveURL(
      new RegExp(`/administrar/personas/(${first.publicId}|${second.publicId})\\?desde=busqueda$`),
    )
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

    const visitor = await visitorContext.newPage()
    await signIn(visitor, first.email, '/administrar')
    await expect(visitor.getByRole('heading', { name: 'Acá no hay nada' })).toBeVisible()
    await expect(visitor.getByRole('link', { name: /^Administrar/u })).toHaveCount(0)
  } finally {
    await visitorContext.close()
    await Promise.all([removePerson(admin), removePerson(first), removePerson(second)])
  }
})

// Covers: US3-AS1, US3-AS5, FR-060, FR-062, FR-063
test('el resumen de la mañana sale una vez, con las colas y sin nombres', async ({ request }) => {
  test.setTimeout(120_000)
  const run = crypto.randomUUID().slice(0, 8)
  const admin = await newPerson(`Lucía ${run}`, { level: 1 })
  await makeAdmin(admin)
  const marta = await newPerson(`Marta ${run}`, { level: 1 })
  const bruno = await newPerson(`Bruno ${run}`, { level: 1 })
  const details = `Publicó tres cachorros con precio (${run})`
  const digest = /^Hay \d+ cosas? esperando en /u
  const tick = () =>
    request.post('/api/cron/resumen', { headers: { 'x-cron-secret': requireEnv('CRON_SECRET') } })
  try {
    await seedReport(marta, bruno, details)

    expect((await request.post('/api/cron/resumen')).status()).toBe(401)
    expect((await tick()).status()).toBe(204)
    // La ruta responde después de mandar todos, pero el archivo puede tardar un instante más.
    await expect.poll(() => mailsTo(admin.email, digest).length, { timeout: 15_000 }).toBe(1)
    const [mail] = mailsTo(admin.email, digest)
    expect(mail?.text).toMatch(/\d+ reportes? sin resolver, el más viejo de hace/u)
    expect(mail?.text).toContain('/administrar?desde=resumen')
    for (const text of [mail?.text ?? '', mail?.html ?? '']) {
      expect(text).not.toContain(run)
    }

    expect((await tick()).status()).toBe(204)
    expect(mailsTo(admin.email, digest)).toHaveLength(1)
  } finally {
    await Promise.all([removePerson(admin), removePerson(marta), removePerson(bruno)])
  }
})
