import { expect, test, type Page } from '@playwright/test'
import { sendApplication } from './support/applications'
import { publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { levelOneOwner, service, signIn } from './support/pet-owner'

// El flujo crítico de la historia #206, contra el build de producción (plan.md §Qué se testea): la
// bandeja agrupa la camada por cría, la rescatista acepta a quien pidió «Cría 2», la marca en
// proceso y adoptada a esa persona, y la ficha dice «3 disponibles» con el sello de la adoptada.
// Aparte, pausar y reanudar la camada devuelve a la cría en proceso a donde estaba.
const LITTER = 'La camada de Luna'

function youngRow(page: Page, name: string) {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
}

async function youngCodes(litterId: string): Promise<Map<string, { id: string; code: string }>> {
  const { data, error } = await service()
    .from('pets')
    .select('id, code, name')
    .eq('litter_id', litterId)
  expect(error).toBeNull()
  return new Map((data ?? []).map((one) => [one.name, { id: one.id, code: one.code }]))
}

async function statusOf(petId: string) {
  const { data } = await service()
    .from('pets')
    .select('status, resume_status')
    .eq('id', petId)
    .single()
  return data
}

// Covers: US1-AS1, US1-AS2, US1-AS3, US1-AS4, US2-AS1, US2-AS3, US2-AS10, US2-AS11, US3-AS1, US3-AS2, SC-004, SC-005
test('responder, marcar y entregar una cría, y pausar y reanudar la camada', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const owner = await levelOneOwner()
  const dani = await newPerson('Dani Prueba', { level: 1 })
  const beto = await newPerson('Beto Prueba', { level: 1 })
  try {
    const litter = await publishLitterForRun(owner.id, 4)
    const young = await youngCodes(litter.id)
    const second = young.get('Cría 2') ?? { id: '', code: '' }
    const third = young.get('Cría 3') ?? { id: '', code: '' }
    // La camada no está castrada: el cuestionario pide el compromiso de castrarla.
    await sendApplication(dani.id, second.code, { neuter_commitment: 'yes' })
    await sendApplication(beto.id, third.code, { neuter_commitment: 'yes' })

    // La bandeja: la camada es un grupo, con una fila en cero por cada cría que nadie pidió.
    await signIn(page, owner.email, '/solicitudes')
    await expect(page.getByRole('heading', { level: 2, name: LITTER })).toBeVisible()
    await expect(page.getByText('Todavía nadie pidió a esta cría', { exact: true })).toHaveCount(2)
    await page.getByRole('link', { name: /Cría 2/ }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: /^Solicitudes por Cría 2/ }),
    ).toBeVisible()
    await page.getByRole('link', { name: /Dani Prueba/ }).click()

    await page.getByRole('button', { name: 'Aceptar solicitud', exact: true }).click()
    await page
      .getByRole('dialog', { name: '¿Aceptar a Dani Prueba?' })
      .getByRole('button', { name: 'Aceptar a Dani Prueba', exact: true })
      .click()
    await expect(page).toHaveURL(/\?aceptada=1$/)
    // La oferta de después de aceptar marca a la cría, no a la camada.
    await page.getByRole('button', { name: 'Marcar en proceso', exact: true }).click()
    await expect(page.getByText(/está en proceso/)).toBeVisible()
    expect(await statusOf(second.id)).toMatchObject({ status: 'in_process' })
    expect(await statusOf(third.id)).toMatchObject({ status: 'available' })

    // Entregarla a Dani desde el panel de la camada.
    // Relativa a donde quedó la sesión: el enlace del correo abre el sitio con su dirección propia.
    const panel = `/mis-animales/camadas/${litter.id}`
    await page.goto(new URL(panel, page.url()).href)
    await expect(youngRow(page, 'Cría 2').getByText('En proceso', { exact: true })).toBeVisible()
    await youngRow(page, 'Cría 2').getByRole('link', { name: 'Marcar adoptada' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: /^¿A quién se l[ao] diste\?$/ }),
    ).toBeVisible()
    await page.getByRole('radio', { name: /Dani Prueba/ }).check()
    await page
      .getByRole('button', { name: /^Acepto el compromiso y marco adoptad[ao] a Dani Prueba$/ })
      .click()
    await expect(page).toHaveURL(new RegExp(`${panel}(\\?|$)`))
    await expect(youngRow(page, 'Cría 2').getByText('Adoptada', { exact: true })).toBeVisible()

    // La ficha, sin sesión: el recuento al día y la adoptada con su sello y sin «Quiero adoptar».
    const visitor = await browser.newContext()
    const anonymous = await visitor.newPage()
    await anonymous.goto(`/camadas/${litter.code}`)
    await expect(anonymous.getByText('4 crías, 3 disponibles')).toBeVisible()
    await expect(anonymous.getByRole('link', { name: 'Quiero adoptar' })).toHaveCount(3)
    await expect(youngRow(anonymous, 'Cría 2').getByText('Adoptada', { exact: true })).toBeVisible()
    await expect(youngRow(anonymous, 'Cría 2').getByRole('link')).toHaveCount(0)

    // Pausar y reanudar con «Cría 3» en proceso: vuelve en proceso, y la adoptada sigue adoptada.
    await youngRow(page, 'Cría 3').getByRole('button', { name: 'Marcar en proceso' }).click()
    await expect(youngRow(page, 'Cría 3').getByText('En proceso', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Pausar', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Reanudar', exact: true })).toBeVisible()
    expect(await statusOf(third.id)).toMatchObject({
      status: 'paused',
      resume_status: 'in_process',
    })
    await anonymous.reload()
    await expect(
      anonymous.getByRole('heading', { name: 'Esta camada está pausada por ahora' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Reanudar', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible()
    await expect(youngRow(page, 'Cría 3').getByText('En proceso', { exact: true })).toBeVisible()
    expect(await statusOf(third.id)).toMatchObject({ status: 'in_process', resume_status: null })
    expect(await statusOf(second.id)).toMatchObject({ status: 'adopted' })
    await anonymous.reload()
    await expect(anonymous.getByText('4 crías, 2 disponibles')).toBeVisible()
    await visitor.close()
  } finally {
    await removePerson(dani)
    await removePerson(beto)
    await removeRunOwner(owner.id)
  }
})
