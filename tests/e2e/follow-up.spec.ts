import { expect, test } from '@playwright/test'
import { acceptApplication, sendApplication } from './support/applications'
import { photoWithGps } from './support/exif-fixture'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { hasMail, mailTo } from './support/mailbox'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

// El seguimiento a los 30 días (historia #69): el flujo crítico de punta a punta, con una rescatista y
// una adoptante propias de la corrida, la adopción marcada con la base y movida 31 días atrás, y la
// vuelta horaria corrida sin esperar.

const ANSWER = 'Duerme en el sillón y ya no le tiene miedo a la correa.'
const ANSWERED_MAIL = 'Ana Prueba contó cómo va Tobi'

async function adoptedMonthAgo(ownerId: string, petId: string, applicationId: string) {
  const db = service()
  const marked = await db.rpc('mark_pet_adopted', {
    p_owner: ownerId,
    p_pet: petId,
    p_attempt: crypto.randomUUID(),
    p_application: applicationId,
  })
  expect(marked.error).toBeNull()
  // `adoptions_forward_only` no deja mover `marked_at`: la fila se vuelve a escribir con otro día.
  const { data: row } = await db.from('adoptions').select('*').eq('pet_id', petId).single()
  expect(row).not.toBeNull()
  await db.from('adoptions').delete().eq('id', row.id)
  const monthAgo = new Date(Date.now() - 31 * 24 * 3_600_000).toISOString()
  const inserted = await db.from('adoptions').insert({ ...row, marked_at: monthAgo })
  expect(inserted.error).toBeNull()
  expect((await db.rpc('run_follow_up_tick')).error).toBeNull()
}

// Covers: US2-AS1, US2-AS2, US2-AS4, US2-AS6, FR-010, FR-015, FR-035
test('quien adoptó cuenta cómo va con 2 fotos y quien lo dio lo ve, con un correo sin el texto', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', sex: 'male' }])
  const pet = pets[0]
  const adopter = await newPerson('Ana Prueba', { level: 1 })
  try {
    const { data: petRow } = await service()
      .from('pets')
      .select('id')
      .eq('code', pet?.code ?? '')
      .single()
    const petId: string = petRow?.id ?? ''
    const id = await sendApplication(adopter.id, pet?.code ?? '')
    await acceptApplication(owner.id, id)
    await adoptedMonthAgo(owner.id, petId, id)

    await signIn(page, adopter.email, `/mis-solicitudes/${id}`)
    await expect(page.getByRole('heading', { name: '¿Cómo va Tobi?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Yo no adopté a Tobi' })).toBeVisible()

    const files = await Promise.all(
      [
        [600, 750],
        [750, 600],
      ].map(async ([width, height], index) => ({
        name: `tobi_${index}.jpg`,
        mimeType: 'image/jpeg',
        buffer: await photoWithGps(page, width, height),
      })),
    )
    await page.locator('input[type=file]').setInputFiles(files)
    await expect(page.getByText('2 de 3 fotos')).toBeVisible()
    await page.getByRole('textbox', { name: 'Contale algo, si querés' }).fill(ANSWER)
    await page.getByRole('button', { name: 'Mandar', exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`/mis-solicitudes/${id}\\?contado=1$`))
    await expect(page.getByText('Adopción con seguimiento', { exact: true })).toBeVisible()
    await expect(page.getByText(/^Lo contaste el /)).toBeVisible()
    await expect(page.getByText(`«${ANSWER}»`)).toBeVisible()
    await expect(page.getByRole('img', { name: /^Foto de Tobi que mandó Ana Prueba/ })).toHaveCount(
      2,
    )
    // Respondido: ya no se manda otra, y «Yo no adopté» no se ofrece; el compromiso sigue pendiente.
    await expect(page.getByRole('button', { name: 'Mandar', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Yo no adopté a Tobi' })).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Acepto el compromiso', exact: true }),
    ).toBeVisible()

    await expect.poll(() => hasMail(owner.email, ANSWERED_MAIL)).toBe(true)
    const mail = mailTo(owner.email, ANSWERED_MAIL)
    expect(mail.html).toContain('src="cid:seguimiento-')
    expect(mail.text).not.toContain(ANSWER)
    expect(mail.html).not.toContain('Duerme en el sillón')
    expect(mail.text).not.toContain(adopter.email)

    const other = await browser.newContext()
    const ownerPage = await other.newPage()
    await signIn(ownerPage, owner.email, `/mis-animales/${petId}`)
    await expect(ownerPage.getByRole('heading', { name: 'El seguimiento' })).toBeVisible()
    await expect(ownerPage.getByText(/^Ana Prueba lo contó el /)).toBeVisible()
    await expect(ownerPage.getByText(`«${ANSWER}»`)).toBeVisible()
    await expect(
      ownerPage.getByRole('img', { name: /^Foto de Tobi que mandó Ana Prueba/ }),
    ).toHaveCount(2)
    await other.close()
  } finally {
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
