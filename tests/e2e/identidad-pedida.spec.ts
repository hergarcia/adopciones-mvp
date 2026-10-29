import { expect, test, type Page } from '@playwright/test'
import { hasMail } from './support/mailbox'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { sendApplication } from './support/applications'
import { signIn } from './support/pet-owner'

// Pedirle la identidad a quien solicitó (historia #257), de punta a punta: la rescatista la pide
// desde la solicitud, quien solicitó la ve en Mi solicitud, manda las fotos y vuelve; Lucía, que
// administra, la aprueba, y la solicitud vuelve a figurar como nueva con el día en que la verificó.

const ADMIN = 'lucia@example.test'

// Un nombre por corrida: la cola de revisión es una sola para todas las pruebas.
function uniqueName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const suffix = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 26)]).join('')
  return `Dani ${suffix}`
}

async function sendPhotos(page: Page) {
  const files = page.locator('input[type="file"]:not([capture])')
  await files.nth(0).setInputFiles('tests/e2e/support/cedula.png')
  await expect(page.getByRole('img', { name: /el frente de tu cédula/i })).toBeVisible()
  await files.nth(1).setInputFiles('tests/e2e/support/selfie.png')
  await expect(page.getByRole('img', { name: /tu selfie con la cédula/i })).toBeVisible()
  await page.getByRole('button', { name: 'Enviar mi pedido' }).click()
}

// Covers: US1-AS1, US1-AS2, US2-AS1, US2-AS2, US2-AS6, US3-AS1, US3-AS2, FR-011, FR-021, FR-024 a FR-026
test('la rescatista pide la identidad, quien solicitó la verifica y la solicitud vuelve como nueva', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', isNeutered: true }])
  const code = pets[0]?.code ?? ''
  const name = uniqueName()
  const adopter = await newPerson(name, { level: 1 })
  const adopterContext = await browser.newContext()
  const adminContext = await browser.newContext()
  try {
    const id = await sendApplication(adopter.id, code)

    // La rescatista pide la identidad desde la solicitud y ve la línea con el día.
    await signIn(page, owner.email, `/solicitudes/${id}`)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await page.getByRole('button', { name: 'Pedirle la identidad', exact: true }).click()
    const confirm = page.getByRole('dialog', { name: `¿Le pedís la identidad a ${name}?` })
    await confirm.getByRole('button', { name: 'Pedirle la identidad', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/solicitudes/${id}\\?identidad=asked$`))
    await expect(page.getByText(/^Le pediste la identidad el \d{2}\/\d{2}\./)).toBeVisible()
    await expect(page.getByText('Todavía no la verificó.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pedirle la identidad' })).toHaveCount(0)
    await expect
      .poll(() =>
        hasMail(adopter.email, 'Quien publicó a Tobi te pide que verifiques tu identidad'),
      )
      .toBe(true)

    // Quien solicitó ve el pedido, va a verificar, manda las fotos y vuelve a su solicitud.
    const adopterPage = await adopterContext.newPage()
    await signIn(adopterPage, adopter.email, `/mis-solicitudes/${id}`)
    const note = adopterPage.getByRole('region', {
      name: 'Quien publicó a Tobi te pide que verifiques tu identidad antes de decidir',
    })
    await expect(note).toBeVisible()
    await note.getByRole('link', { name: 'Verificar mi identidad' }).click()
    await expect(adopterPage).toHaveURL(/\/verificar-identidad\?.*solicitud=/)
    await adopterPage.getByRole('button', { name: 'Acepto y elijo las fotos' }).click()
    await sendPhotos(adopterPage)
    await expect(adopterPage).toHaveURL(new RegExp(`/mis-solicitudes/${id}$`))
    await expect(note.getByText('En revisión', { exact: true })).toBeVisible()
    await expect(note.getByRole('link', { name: 'Verificar mi identidad' })).toHaveCount(0)

    // Lucía la aprueba desde la cola.
    const admin = await adminContext.newPage()
    await signIn(admin, ADMIN, '/revision')
    const row = admin.getByRole('listitem').filter({ hasText: name })
    await row.getByRole('link', { name: /Ver$/u }).click()
    await expect(admin.getByRole('heading', { name })).toBeVisible()
    const opened = admin.url()
    await admin.getByRole('button', { name: 'Aprobar' }).click()
    await expect(admin).not.toHaveURL(opened)

    // La solicitud vuelve a figurar como nueva, con el día de la aprobación, y le llega el correo.
    await expect
      .poll(() => hasMail(owner.email, 'Quien solicitó a Tobi verificó su identidad'), {
        timeout: 15_000,
      })
      .toBe(true)
    await page.goto(new URL('/solicitudes', page.url()).toString())
    await page.getByRole('link', { name: /Tobi/ }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Solicitudes por Tobi' }),
    ).toBeVisible()
    await expect(page.getByText('Nueva', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: new RegExp(name) }).click()
    await expect(page.getByText(/Verificó su identidad el \d{2}\/\d{2}\./)).toBeVisible()
    await expect(page.getByText('Todavía no la verificó.')).toHaveCount(0)
  } finally {
    await adopterContext.close()
    await adminContext.close()
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
