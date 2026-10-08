import { expect, test } from '@playwright/test'
import { acceptApplication, sendApplication, verifiedNumber, written } from './support/applications'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { hasMail, mailTo } from './support/mailbox'
import { newPerson, removePerson } from './support/people'
import { signIn } from './support/pet-owner'

// La entrega y el compromiso (historia #67): el flujo crítico de punta a punta, con una rescatista
// y una adoptante propias de la corrida, y la solicitud ya aceptada con las funciones de la base.

const COMMITMENT_MAIL = 'El compromiso por Tobi'

// Covers: US1-AS1, US1-AS2, US1-AS3, US2-AS1, US2-AS2, US2-AS3, FR-014, FR-051, FR-054, SC-001
test('la rescatista marca adoptado a quien se lo dio, ella acepta el compromiso y las dos lo reciben', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000)
  const { owner, pets } = await publishForRun([
    { name: 'Tobi', species: 'dog', sex: 'male', isNeutered: false },
  ])
  const code = pets[0]?.code ?? ''
  const adopter = await newPerson('Ana Prueba', { level: 1 })
  try {
    const id = await sendApplication(adopter.id, code, { neuter_commitment: 'yes' })
    await acceptApplication(owner.id, id)

    await signIn(page, owner.email, '/mis-animales')
    await page.getByRole('button', { name: 'Más acciones' }).click()
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'Marcar adoptado', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: '¿A quién se lo diste?' }),
    ).toBeVisible()
    await page.getByRole('radio', { name: /Ana Prueba/ }).check()
    await expect(page.getByText('Ana Prueba se compromete a castrar a Tobi.')).toBeVisible()
    await page
      .getByRole('button', { name: 'Acepto el compromiso y marco adoptado a Ana Prueba' })
      .click()

    await expect(page).toHaveURL(/\/mis-animales\?adoptado=/)
    await expect(page.getByText('Adoptado por Ana Prueba', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Compromiso pendiente de Ana Prueba', { exact: true }),
    ).toBeVisible()
    await expect
      .poll(() => hasMail(adopter.email, 'Adoptaste a Tobi: aceptá el compromiso'))
      .toBe(true)

    const other = await browser.newContext()
    const adopterPage = await other.newPage()
    await signIn(adopterPage, adopter.email, `/mis-solicitudes/${id}`)
    await expect(adopterPage.getByRole('heading', { name: 'El compromiso' })).toBeVisible()
    await expect(adopterPage.getByText('Compromiso pendiente', { exact: true })).toBeVisible()
    await expect(adopterPage.getByText(written(await verifiedNumber(owner.id)))).toBeVisible()
    await adopterPage.getByRole('button', { name: 'Acepto el compromiso', exact: true }).click()

    await expect(adopterPage).toHaveURL(new RegExp(`/mis-solicitudes/${id}\\?compromiso=1$`))
    await expect(adopterPage.getByText('Aceptaste el compromiso', { exact: true })).toBeVisible()
    await expect(adopterPage.getByText(/^Vos lo aceptaste el /)).toBeVisible()
    await expect(adopterPage.getByText(/ lo aceptó el /)).toBeVisible()
    await expect(
      adopterPage.getByRole('button', { name: 'Acepto el compromiso', exact: true }),
    ).toHaveCount(0)
    await other.close()

    await expect.poll(() => hasMail(adopter.email, COMMITMENT_MAIL)).toBe(true)
    await expect.poll(() => hasMail(owner.email, COMMITMENT_MAIL)).toBe(true)
    const phones = [
      written(await verifiedNumber(owner.id)),
      written(await verifiedNumber(adopter.id)),
    ]
    for (const email of [adopter.email, owner.email]) {
      const mail = mailTo(email, COMMITMENT_MAIL)
      expect(mail.text).toContain('Ana Prueba se compromete a castrar a Tobi.')
      expect(mail.text).toMatch(/Ana Prueba lo aceptó el /)
      for (const phone of phones) expect(mail.text).not.toContain(phone)
      expect(mail.text).not.toContain(adopter.email)
    }

    await page.reload()
    await expect(page.getByText(/^Compromiso aceptado el /)).toBeVisible()
  } finally {
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
