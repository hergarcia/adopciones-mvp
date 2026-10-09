import { expect, test, type Page } from '@playwright/test'
import { sendApplication } from './support/applications'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'

// Los dos flujos críticos de la historia #71 (plan §Qué se testea): una opinión sin sesión desde la
// ficha, que quien administra lee con la ficha como pantalla; y la encuesta de quien no fue elegida,
// que Encuestas cuenta. Todas las personas y los animales son de la corrida: el seed no cambia.

async function newAdmin(): Promise<Person> {
  const admin = await newPerson('Lucía Prueba', { level: 1 })
  expect((await service().from('admins').insert({ user_id: admin.id })).error).toBeNull()
  return admin
}

const NOT_CHOSEN = '¿Vas a seguir buscando por acá?'

// «Se ofrecieron 3, se respondieron 2 y …»: las cuentas son de toda la base y otras pruebas suman
// en paralelo, así que se compara contra lo que había antes. Relativa a donde quedó la sesión: el
// enlace del correo abre el sitio con su dirección propia.
async function notChosenCounts(page: Page): Promise<{ offered: number; answered: number }> {
  await page.goto(new URL('/revision/encuestas', page.url()).href)
  const moment = page.getByRole('region', { name: NOT_CHOSEN })
  const counts = (await moment.getByText(/^Se ofreci/).textContent()) ?? ''
  const [offered, answered] = [/ofreci(?:ó|eron) (\d+)/u, /respondi(?:ó|eron) (\d+)/u].map(
    (pattern) => Number(pattern.exec(counts)?.[1] ?? Number.NaN),
  )
  return { offered: offered ?? Number.NaN, answered: answered ?? Number.NaN }
}

// Covers: US2-AS1, US2-AS6, US3-AS1, FR-020, FR-022, FR-024, FR-043
test('una opinión sin sesión desde la ficha llega a Opiniones con la ficha como pantalla', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000)
  const run = crypto.randomUUID().slice(0, 8)
  const name = `Luna ${run}`
  const opinion = `No entiendo por qué me piden el teléfono para preguntar (${run})`
  const { owner, pets } = await publishForRun([{ name, species: 'cat' }])
  const admin = await newAdmin()
  const adminContext = await browser.newContext()
  try {
    await page.goto(`/animales/${pets[0]?.code ?? ''}`)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await page.getByRole('link', { name: 'Opinar', exact: true }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Opinar' })).toBeVisible()

    const box = page.getByRole('textbox', { name: 'Tu opinión' })
    const withPhone = `${opinion}. Llamame al 099 123 456`
    await box.fill(withPhone)
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(
      page.getByText('Sacá «099 123 456»: no puede llevar un teléfono ni un correo.'),
    ).toBeVisible()
    await expect(box).toHaveValue(withPhone)

    await box.fill(opinion)
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByText('Tu opinión llegó. Gracias.')).toBeVisible()

    const adminPage = await adminContext.newPage()
    await signIn(adminPage, admin.email, '/revision/opiniones')
    await expect(adminPage.getByRole('heading', { level: 1, name: 'Opiniones' })).toBeVisible()
    const entry = adminPage.getByRole('article').filter({ hasText: opinion })
    await expect(entry).toHaveCount(1)
    await expect(entry.getByRole('link', { name: `Ficha de ${name}` })).toBeVisible()
    await expect(entry.getByText(admin.name)).toHaveCount(0)
  } finally {
    await adminContext.close()
    await service().from('feedback').delete().like('body', `%(${run})%`)
    await removePerson(admin)
    await removeRunOwner(owner.id)
  }
})

// Covers: US1-AS3, US3-AS3, FR-003, FR-011, FR-042, SC-002
test('quien no fue elegida responde la encuesta en Mi solicitud y Encuestas la cuenta', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const run = crypto.randomUUID().slice(0, 8)
  const name = `Tobi ${run}`
  const answer = `Me gustó que fuera rápido (${run})`
  const { owner, pets } = await publishForRun([{ name, species: 'dog', isNeutered: true }])
  const applicant = await newPerson('Bruno Prueba', { level: 1 })
  const admin = await newAdmin()
  const adminContext = await browser.newContext()
  const applicantContext = await browser.newContext()
  try {
    const id = await sendApplication(applicant.id, pets[0]?.code ?? '')
    const adminPage = await adminContext.newPage()
    await signIn(adminPage, admin.email, '/revision/encuestas')
    const before = await notChosenCounts(adminPage)
    expect(before.offered).not.toBeNaN()

    await signIn(page, owner.email, `/solicitudes/${id}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Bruno Prueba' })).toBeVisible()
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
    const reject = page.getByRole('dialog', { name: '¿Por qué no seguís con Bruno Prueba?' })
    await reject.getByRole('radio', { name: 'Elegí a otra persona' }).check()
    await reject.getByRole('button', { name: 'Rechazar', exact: true }).click()
    await expect(
      page.getByText('Rechazaste la solicitud de Bruno Prueba.', { exact: true }),
    ).toBeVisible()

    const applicantPage = await applicantContext.newPage()
    await signIn(applicantPage, applicant.email, `/mis-solicitudes/${id}`)
    const survey = applicantPage.getByRole('region', { name: NOT_CHOSEN })
    await expect(survey).toBeVisible()
    await survey.getByRole('radio', { name: 'No, vuelvo a los grupos' }).check()
    await survey.getByRole('textbox', { name: '¿Algo más que quieras contarnos?' }).fill(answer)
    await survey.getByRole('button', { name: 'Enviar' }).click()
    await expect(applicantPage.getByText('Gracias por contarnos.')).toBeVisible()

    await applicantPage.reload()
    await expect(applicantPage.getByText('No aceptada', { exact: true })).toBeVisible()
    await expect(applicantPage.getByRole('region', { name: NOT_CHOSEN })).toHaveCount(0)

    const after = await notChosenCounts(adminPage)
    expect(after.offered).toBeGreaterThanOrEqual(before.offered + 1)
    expect(after.answered).toBeGreaterThanOrEqual(before.answered + 1)
    const written = adminPage
      .getByRole('region', { name: NOT_CHOSEN })
      .getByRole('listitem')
      .filter({ hasText: answer })
    await expect(written).toHaveCount(1)
    await expect(written.getByText(/, No, vuelvo a los grupos$/u)).toBeVisible()
    await expect(written.getByText('Bruno Prueba')).toHaveCount(0)
  } finally {
    await adminContext.close()
    await applicantContext.close()
    await removePerson(admin)
    await removePerson(applicant)
    await removeRunOwner(owner.id)
  }
})
