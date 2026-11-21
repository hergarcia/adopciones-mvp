import { expect, test, type Locator } from '@playwright/test'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { service, signIn } from './support/pet-owner'

// «Cómo le va a…» (historia #269): las aperturas y los toques que hace la gente llegan a la página
// del animal en «Mis animales», y solo ahí. Una rescatista y una persona sin teléfono propias de la
// corrida, así el seed y las capturas no cambian.

const WHATSAPP = 'WhatsApp/2.23.20.0'

async function countsOf(code: string) {
  const { data } = await service()
    .from('pets')
    .select('id, publication_stats (opens, taps, phone_stops)')
    .eq('code', code)
    .single()
  const stats = data?.publication_stats
  return { id: data?.id ?? '', counts: Array.isArray(stats) ? stats[0] : stats }
}

/** El renglón del bloque que dice `label`, con su número. */
function row(block: Locator, label: string) {
  return block
    .locator('div')
    .filter({ has: block.page().getByRole('term').getByText(label, { exact: true }) })
}

// Covers: US1-AS1, US1-AS6, US1-AS7, US1-AS9, US1-AS15, FR-002, FR-022, SC-002
test('las aperturas y el freno por el teléfono llegan a «Mis animales», y solo ahí', async ({
  browser,
  page,
}) => {
  test.setTimeout(120_000)
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', sex: 'male' }])
  const code = pets[0]?.code ?? ''
  const bruno = await newPerson('Bruno Prueba', { level: 0 })
  const anonymous = await browser.newContext()
  const preview = await browser.newContext({ userAgent: WHATSAPP })
  const brunoContext = await browser.newContext()
  try {
    const visitor = await anonymous.newPage()
    await visitor.goto('/animales')
    await visitor.locator(`a[href^="/animales/${code}"]`).first().hover()
    await visitor.goto(`/animales/${code}`)
    await visitor.reload()
    await (await preview.newPage()).goto(`/animales/${code}`)

    const brunoPage = await brunoContext.newPage()
    await signIn(brunoPage, bruno.email, `/animales/${code}`)
    await brunoPage.getByRole('link', { name: 'Quiero adoptar' }).click()
    await expect(brunoPage).toHaveURL(/verificar-telefono/)
    // La vuelta de Bruno a la ficha también es una apertura: tres de gente, ninguna de la vista previa.
    await expect
      .poll(async () => (await countsOf(code)).counts)
      .toEqual({
        opens: 3,
        taps: 1,
        phone_stops: 1,
      })

    const { id } = await countsOf(code)
    await signIn(page, owner.email, `/mis-animales/${id}`)
    await expect(page.getByRole('region', { name: 'Cómo le va a Tobi' })).toBeVisible()
    // El enlace del correo vuelve a la dirección del sitio, que no es la de la prueba: la sesión
    // vive ahí.
    const here = (path: string) => new URL(path, page.url()).toString()
    await page.goto(here(`/animales/${code}`))
    await expect(page.getByRole('link', { name: 'Editar' })).toBeVisible()
    await page.goto(here(`/mis-animales/${id}`))
    const block = page.getByRole('region', { name: 'Cómo le va a Tobi' })
    await expect(block.getByText('Desde que lo publicaste')).toBeVisible()
    await expect(row(block, 'veces que se abrió la ficha')).toContainText('3')
    await expect(row(block, 'vez que tocaron «Quiero adoptar»')).toContainText('1')
    await expect(row(block, 'vez que no pudo seguir sin el teléfono verificado')).toContainText('1')
    await expect(row(block, 'solicitudes que llegaron')).toContainText('0')
    await expect(block.getByText(/sin la identidad verificada/)).toHaveCount(0)
    await expect(block.getByText('Pedís el teléfono verificado')).toBeVisible()
    expect((await countsOf(code)).counts?.opens, 'la ficha propia no suma').toBe(3)

    await brunoPage.goto(new URL(`/animales/${code}`, brunoPage.url()).toString())
    await expect(brunoPage.getByRole('heading', { level: 1, name: 'Tobi' })).toBeVisible()
    await expect(brunoPage.getByText('veces que se abrió la ficha')).toHaveCount(0)
    await expect(brunoPage.getByRole('region', { name: 'Cómo le va a Tobi' })).toHaveCount(0)
  } finally {
    await Promise.all([anonymous.close(), preview.close(), brunoContext.close()])
    await removePerson(bruno)
    await removeRunOwner(owner.id)
  }
})
