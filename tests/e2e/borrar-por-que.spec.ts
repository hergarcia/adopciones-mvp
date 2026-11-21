import { expect, test } from '@playwright/test'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { service, signIn } from './support/pet-owner'

// El flujo crítico de la historia #263, contra el build de producción: Carla borra a Luna, una
// hembra disponible, después de elegir, destildar y volver a elegir por qué; se cuenta una sola
// respuesta con lo que estaba elegido. Nube, adoptada, se confirma como siempre, sin la pregunta.
const OPTIONS = [
  'No llegaron solicitudes',
  'Las solicitudes que llegaron no me convencieron',
  'La di en adopción por Facebook, Instagram o WhatsApp',
  'Ya no está en adopción',
  'Otra cosa',
]

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

async function idOf(code: string): Promise<string> {
  const { data } = await service().from('pets').select('id').eq('code', code).single()
  return data?.id ?? ''
}

async function answersWith(reason: string): Promise<number> {
  const { count } = await service()
    .from('deletion_reasons')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'pet')
    .eq('reason', reason)
  return count ?? 0
}

// Covers: US1-AS1, US1-AS2, US1-AS5, US1-AS6, FR-006, FR-007, FR-008, FR-009
test('borrar una disponible pregunta por qué y cuenta lo elegido; una adoptada, no', async ({
  page,
}) => {
  const luna = `Luna ${suffix()}`
  const nube = `Nube ${suffix()}`
  const { owner, pets } = await publishForRun([
    { name: luna, species: 'dog', sex: 'female' },
    { name: nube, species: 'cat', sex: 'female' },
  ])
  const [lunaPet, nubePet] = pets
  const nubeId = await idOf(nubePet.code)
  await service().from('pets').update({ status: 'adopted', expires_at: null }).eq('id', nubeId)

  try {
    await signIn(page, owner.email, `/mis-animales/${nubeId}`)
    await page.getByRole('button', { name: 'Borrar', exact: true }).click()
    const plain = page.getByRole('dialog', { name: `¿Borrar a ${nube}?` })
    await expect(plain.getByRole('button', { name: 'Borrar para siempre' })).toBeVisible()
    await expect(plain.getByRole('radio')).toHaveCount(0)
    await plain.getByRole('button', { name: 'No borrar' }).click()

    // El enlace del correo entra por el dominio del sitio, que no es la base de la prueba: la
    // sesión vive ahí.
    await page.goto(new URL(`/mis-animales/${await idOf(lunaPet.code)}`, page.url()).toString())
    await page.getByRole('button', { name: 'Borrar', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: `¿Borrar a ${luna}?` })
    const question = dialog.getByRole('group', { name: '¿Por qué la borrás?' })
    await expect(question.getByRole('radio')).toHaveCount(5)
    for (const option of OPTIONS) {
      // oxlint-disable-next-line no-await-in-loop -- en el orden de la historia
      await expect(question.getByRole('radio', { name: option })).not.toBeChecked()
    }

    const mistaken = question.getByRole('radio', { name: 'Ya no está en adopción' })
    await mistaken.click()
    await expect(mistaken).toBeChecked()
    await mistaken.click()
    await expect(mistaken).not.toBeChecked()
    await question.getByRole('radio', { name: 'No llegaron solicitudes' }).click()

    const before = await answersWith('no_applications')
    await dialog.getByRole('button', { name: 'Borrar para siempre' }).click()
    await expect(page).toHaveURL(/\/mis-animales(\?guardado=borrado)?$/)
    await expect(page.getByText('Borrado', { exact: true })).toBeVisible()
    await expect.poll(() => answersWith('no_applications')).toBe(before + 1)
  } finally {
    await removeRunOwner(owner.id)
  }
})
