import { expect, test, type Page } from '@playwright/test'
import { URUGUAY_TIME_ZONE } from '../../src/lib/verification/rules'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

// La solicitud que espera la identidad (historia #289), de punta a punta: con el pedido de identidad
// en revisión, quien quiere adoptar a Tobi la deja escrita; la rescatista no ve nada; Lucía, que
// administra, aprueba la identidad, y la solicitud sale con el día de hoy y le llega como nueva.

const ADMIN = 'lucia@example.test'

// Un nombre por corrida: la cola de revisión es una sola para todas las pruebas.
function uniqueName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const suffix = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 26)]).join('')
  return `Bruno ${suffix}`
}

// El pedido de identidad como lo manda la persona: las fotos pasan por el sitio, que las deja como
// la revisión las puede mostrar.
async function sendIdentityRequest(page: Page) {
  await page.getByRole('button', { name: 'Acepto y elijo las fotos' }).click()
  const files = page.locator('input[type="file"]:not([capture])')
  await files.nth(0).setInputFiles('tests/e2e/support/cedula.png')
  await expect(page.getByRole('img', { name: /el frente de tu cédula/i })).toBeVisible()
  await files.nth(1).setInputFiles('tests/e2e/support/selfie.png')
  await expect(page.getByRole('img', { name: /tu selfie con la cédula/i })).toBeVisible()
  await page.getByRole('button', { name: 'Enviar mi pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Tu pedido está en revisión' })).toBeVisible()
}

async function requireIdentity(code: string) {
  const { error } = await service().from('pets').update({ required_level: 2 }).eq('code', code)
  expect(error).toBeNull()
}

async function answer(page: Page, legend: string, option: string) {
  await page
    .getByRole('group', { name: legend })
    .getByRole('radio', { name: option, exact: true })
    .check()
  await page.getByRole('button', { name: 'Siguiente' }).click()
}

async function write(page: Page, label: string, text: string) {
  await page.getByRole('textbox', { name: label }).fill(text)
  await page.getByRole('button', { name: 'Siguiente' }).click()
}

async function fillQuestionnaire(page: Page) {
  await answer(page, '¿Dónde vivís?', 'Apartamento')
  await answer(page, '¿Es propia o alquilada?', 'Propia')
  await answer(page, '¿Tenés patio o balcón?', 'Balcón con red')
  await write(page, '¿Quiénes viven en la casa?', 'Mi pareja y yo.')
  await write(page, '¿Hay otros animales en la casa?', 'Ninguno.')
  await answer(page, '¿Cuántas horas por día estaría sin compañía?', 'De 4 a 8')
  await write(page, '¿Qué pasa con el animal si te mudás o te vas de viaje?', 'Se viene conmigo.')
  await write(page, '¿Tuviste perros o gatos antes?', 'Una perra, doce años.')
  await answer(
    page,
    '¿Contás con plata para vacunas, castración y una urgencia del veterinario?',
    'Justo',
  )
  await page.getByRole('textbox', { name: '¿Por qué Tobi?' }).fill('Porque es tranquilo.')
}

const today = () =>
  new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    timeZone: URUGUAY_TIME_ZONE,
  }).format(new Date())

// Covers: US1-AS1, US1-AS2, US2-AS1, US2-AS2, FR-001, FR-008, FR-012, FR-017, FR-020, FR-021
test('con la identidad en revisión la deja escrita, nadie la ve y sale sola al aprobarse', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', isNeutered: true }])
  const code = pets[0]?.code ?? ''
  await requireIdentity(code)
  const name = uniqueName()
  const adopter = await newPerson(name, { level: 1 })
  const publisherContext = await browser.newContext()
  const adminContext = await browser.newContext()
  try {
    await signIn(page, adopter.email, '/verificar-identidad')
    await sendIdentityRequest(page)

    // Con el pedido en revisión, la pantalla de identidad pedida ofrece dejarla escrita.
    await page.goto(new URL(`/solicitar/${code}`, page.url()).toString())
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tobi pide identidad verificada' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Dejar escrita mi solicitud' }).click()
    await fillQuestionnaire(page)
    await page.getByRole('button', { name: 'Dejarla lista' }).click()
    await expect(page).toHaveURL(/\/dejada\?id=/)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Tu solicitud por Tobi sale sola cuando aprueben tu identidad.',
      }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Ver mis solicitudes' }).click()
    await expect(page.getByText('1 de 3 solicitudes activas')).toBeVisible()
    await expect(page.getByText('Espera tu identidad', { exact: true })).toBeVisible()

    // La rescatista no ve nada.
    const publisher = await publisherContext.newPage()
    await signIn(publisher, owner.email, '/solicitudes')
    await expect(publisher.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(publisher.getByText(name)).toHaveCount(0)

    // Lucía aprueba la identidad desde la cola.
    const admin = await adminContext.newPage()
    await signIn(admin, ADMIN, '/revision')
    await admin
      .getByRole('listitem')
      .filter({ hasText: name })
      .getByRole('link', { name: /Ver$/u })
      .click()
    await expect(admin.getByRole('heading', { name })).toBeVisible()
    const opened = admin.url()
    await admin.getByRole('button', { name: 'Aprobar' }).click()
    await expect(admin).not.toHaveURL(opened)

    // Salió: esperando respuesta, con el día de hoy.
    await page.reload()
    await expect(page.getByText('Esperando respuesta', { exact: true })).toBeVisible()
    await expect(page.getByText(`Enviada el ${today()}`, { exact: true })).toBeVisible()
    await expect(page.getByText('Espera tu identidad', { exact: true })).toHaveCount(0)
    await expect(page.getByText('1 de 3 solicitudes activas')).toBeVisible()

    // Y le llega a la rescatista como nueva.
    await publisher.reload()
    await publisher.getByRole('link', { name: /Tobi/ }).click()
    await expect(
      publisher.getByRole('heading', { level: 1, name: 'Solicitudes por Tobi' }),
    ).toBeVisible()
    await expect(publisher.getByText('Nueva', { exact: true })).toBeVisible()
    await expect(publisher.getByRole('link', { name: new RegExp(name) })).toBeVisible()
  } finally {
    await publisherContext.close()
    await adminContext.close()
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
