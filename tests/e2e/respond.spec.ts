import { expect, test } from '@playwright/test'
import { hasMail } from './support/mailbox'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

// Responder una solicitud (historia #65): el flujo crítico de punta a punta, con una rescatista y una
// adoptante propias de la corrida. La solicitud se manda con la función de la base, como la manda el
// sitio, así la prueba empieza en la bandeja.

async function sendApplication(applicantId: string, code: string): Promise<string> {
  const { data, error } = await service().rpc('submit_application', {
    p_applicant: applicantId,
    p_attempt: crypto.randomUUID(),
    p_code: code,
    p_answers: {
      housing_type: 'apartment',
      housing_tenure: 'owned',
      outdoor_space: 'netted_balcony',
      household: 'Mi pareja y yo.',
      other_pets: 'Ninguno.',
      hours_alone: '4_to_8',
      moving_plan: 'Se viene conmigo.',
      experience: 'Una perra, doce años.',
      vet_budget: 'tight',
      why_this_pet: 'Porque es tranquilo.',
    },
    p_pending_ttl: '7 days',
  })
  expect(error).toBeNull()
  const row: unknown = data?.[0]
  expect(row).toMatchObject({ outcome: 'sent' })
  return String(Reflect.get(Object(row), 'application_id'))
}

async function verifiedNumber(userId: string): Promise<string> {
  const { data } = await service()
    .from('phones')
    .select('verified_number')
    .eq('user_id', userId)
    .single()
  return String(data?.verified_number ?? '')
}

// «099 123 456» a partir de +59899123456, como lo escribe la pantalla.
function written(e164: string): string {
  const national = `0${e164.slice(4)}`
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}

// Covers: US1-AS1, US1-AS2, US1-AS3, US1-AS4, US2-AS5, FR-012, FR-014, FR-024, FR-051, SC-001
test('la rescatista acepta, las dos ven el teléfono de la otra y, al dejarla sin efecto, ninguna', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', isNeutered: true }])
  const code = pets[0]?.code ?? ''
  const adopter = await newPerson('Dani Prueba', { level: 1 })
  try {
    const id = await sendApplication(adopter.id, code)

    await signIn(page, owner.email, '/solicitudes')
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes' })).toBeVisible()
    await page.getByRole('link', { name: /Tobi/ }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Solicitudes por Tobi' }),
    ).toBeVisible()
    await expect(page.getByText('Nueva', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: /Dani Prueba/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Dani Prueba' })).toBeVisible()
    await expect(page.getByText('Lo que contestó')).toBeVisible()
    await expect(page.getByText(written(await verifiedNumber(adopter.id)))).toHaveCount(0)

    await page.getByRole('button', { name: 'Aceptar', exact: true }).click()
    const confirm = page.getByRole('dialog', { name: '¿Aceptar a Dani Prueba?' })
    await expect(confirm.getByText(/va a ver tu nombre y tu teléfono, y vos el suyo/)).toBeVisible()
    await confirm.getByRole('button', { name: 'Aceptar', exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`/solicitudes/${id}\\?aceptada=1$`))
    await expect(page.getByText(written(await verifiedNumber(adopter.id)))).toBeVisible()
    const whatsapp = page.getByRole('link', { name: 'Abrir WhatsApp' })
    await expect(whatsapp).toHaveAttribute('href', `/api/solicitudes/${id}/whatsapp`)
    await expect(page.getByRole('button', { name: 'Marcar en proceso' })).toBeVisible()

    // Relativa a donde quedó la sesión: el enlace del correo abre el sitio con su dirección propia.
    const redirect = await page.request.get(
      new URL(`/api/solicitudes/${id}/whatsapp`, page.url()).href,
      {
        maxRedirects: 0,
      },
    )
    expect(redirect.status()).toBe(303)
    const location = redirect.headers().location ?? ''
    expect(location).toMatch(/^https:\/\/wa\.me\/598\d{8}\?text=/)
    expect(decodeURIComponent(location)).toContain('Acepté tu solicitud por Tobi')

    await expect.poll(() => hasMail(adopter.email, 'Aceptaron tu solicitud por Tobi')).toBe(true)

    const other = await browser.newContext()
    const adopterPage = await other.newPage()
    await signIn(adopterPage, adopter.email, `/mis-solicitudes/${id}`)
    await expect(adopterPage.getByText('Aceptada', { exact: true })).toBeVisible()
    await expect(adopterPage.getByText(written(await verifiedNumber(owner.id)))).toBeVisible()
    await expect(adopterPage.getByRole('link', { name: 'Abrir WhatsApp' })).toBeVisible()

    // US2: la adopción no se concreta y la rescatista deja la aceptación sin efecto.
    await page.getByRole('button', { name: 'Dejar sin efecto' }).click()
    const sheet = page.getByRole('dialog', {
      name: '¿Dejar sin efecto la aceptación de Dani Prueba?',
    })
    await sheet.getByRole('radio', { name: 'La adopción no se concretó' }).check()
    await sheet.getByRole('button', { name: 'Dejar sin efecto' }).click()

    await expect(page).toHaveURL(new RegExp(`/solicitudes/${id}\\?sin-efecto=1$`))
    await expect(page.getByText('La dejaste sin efecto: la adopción no se concretó.')).toBeVisible()
    await expect(page.getByText(written(await verifiedNumber(adopter.id)))).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveCount(0)

    await adopterPage.reload()
    await expect(adopterPage.getByText('No aceptada', { exact: true })).toBeVisible()
    await expect(adopterPage.getByText(written(await verifiedNumber(owner.id)))).toHaveCount(0)
    await expect(adopterPage.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveCount(0)
    await expect(adopterPage.getByText('la adopción no se concretó')).toHaveCount(0)
    await other.close()
  } finally {
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
