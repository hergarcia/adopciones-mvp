import { expect, test } from '@playwright/test'
import { acceptApplication, sendApplication, verifiedNumber, written } from './support/applications'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { hasMail, mailTo } from './support/mailbox'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

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

async function idOf(code: string): Promise<string> {
  const { data } = await service().from('pets').select('id').eq('code', code).single()
  return data?.id ?? ''
}

// «¿Por dónde te encontró?» (historia #254), contra el build de producción: aparece solo en el
// camino por fuera, sin nada elegido, se vacía al cambiar de camino y nunca frena marcar. Que la
// medición lleve el canal lo prueban `handoverEvent` y `handoverRequest`: en pruebas no sale nada.
// Covers: US1-AS1, US1-AS3, US1-AS4, US1-AS5, US1-AS6 de #254
test('por fuera pregunta por dónde te encontró, sin nada elegido, y marca igual', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const { owner, pets } = await publishForRun([
    { name: 'Luna', species: 'dog', sex: 'female' },
    { name: 'Mora', species: 'cat', sex: 'female' },
  ])
  const [luna, mora] = pets
  const beto = await newPerson('Beto Prueba', { level: 1 })
  try {
    await acceptApplication(owner.id, await sendApplication(beto.id, luna?.code ?? ''))

    await signIn(page, owner.email, `/mis-animales/${await idOf(luna?.code ?? '')}/adoptado`)
    await expect(
      page.getByRole('heading', { level: 1, name: '¿A quién se la diste?' }),
    ).toBeVisible()
    const question = page.getByRole('group', { name: '¿Por dónde te encontró?' })
    await expect(question).toHaveCount(0)

    const outside = page.getByRole('radio', { name: 'Se la di a alguien que no vino por el sitio' })
    await outside.check()
    await expect(question.getByRole('radio')).toHaveCount(6)
    await expect(question.getByRole('radio', { checked: true })).toHaveCount(0)
    await expect(
      question.getByRole('radio', { name: 'Vio a Luna en este sitio y me escribió directo' }),
    ).toBeVisible()

    const instagram = question.getByRole('radio', { name: 'Instagram', exact: true })
    await instagram.click()
    await expect(instagram).toBeChecked()
    await instagram.click()
    await expect(instagram).not.toBeChecked()

    await instagram.click()
    await page.getByRole('radio', { name: /Beto Prueba/ }).check()
    await expect(question).toHaveCount(0)
    await outside.check()
    await expect(question.getByRole('radio', { checked: true })).toHaveCount(0)

    await page.getByRole('button', { name: 'Marcar adoptada', exact: true }).click()
    await expect(page).toHaveURL(/\/mis-animales\?adoptado=/)
    await expect(page.getByText('Luna quedó adoptada', { exact: true })).toBeVisible()

    // Sin aceptadas, la pregunta está al abrir, debajo de la nota y antes del botón.
    await page.goto(
      new URL(`/mis-animales/${await idOf(mora?.code ?? '')}/adoptado`, page.url()).toString(),
    )
    await expect(
      page.getByRole('heading', { level: 1, name: 'Marcar adoptada a Mora' }),
    ).toBeVisible()
    const note = page.getByText(/^Sin una solicitud aceptada, no queda compromiso/)
    const confirm = page.getByRole('button', { name: 'Marcar adoptada', exact: true })
    await expect(question.getByRole('radio', { checked: true })).toHaveCount(0)
    const [noteBox, questionBox, confirmBox] = await Promise.all([
      note.boundingBox(),
      question.boundingBox(),
      confirm.boundingBox(),
    ])
    expect(questionBox?.y ?? 0).toBeGreaterThan(noteBox?.y ?? Infinity)
    expect(confirmBox?.y ?? 0).toBeGreaterThan(questionBox?.y ?? Infinity)

    await question.getByRole('radio', { name: 'Un grupo o una página de Facebook' }).click()
    await confirm.click()
    await expect(page).toHaveURL(/\/mis-animales\?adoptado=/)
    await expect(page.getByText('Mora quedó adoptada', { exact: true })).toBeVisible()
  } finally {
    await removePerson(beto)
    await removeRunOwner(owner.id)
  }
})
