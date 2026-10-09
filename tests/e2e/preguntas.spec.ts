import { expect, test, type Page } from '@playwright/test'

// Los flujos críticos de la historia #8 contra el build de producción (plan §Tests).

const PHONE = { width: 390, height: 844 }

const PAGES = [
  'como-se-verifica',
  'antes-de-entregar',
  'que-exige-uruguay',
  'reconocer-una-estafa',
  'compromiso-y-seguimiento',
] as const

function ladder(page: Page) {
  return page
    .getByRole('main')
    .locator('ol')
    .filter({ has: page.getByRole('heading', { name: 'Nivel 1' }) })
}

async function expectAboveTheFold(page: Page, selector: string) {
  const box = await page.getByRole('main').locator(selector).first().boundingBox()
  expect(box, `${selector} a la vista`).not.toBeNull()
  expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(PHONE.height)
}

// Covers: US2-AS1, US2-AS2, US2-AS3, US2-AS4, SC-005
test('sin sesión, el pie lleva al índice y el índice a cada página', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.goto('/animales')

  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Preguntas y respuestas', exact: true })
    .click()
  await expect(page).toHaveURL(/\/preguntas$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preguntas y respuestas')

  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([
    'Si das en adopción',
    'Si adoptás',
    'Para todos',
  ])
  const giver = main.getByRole('region', { name: 'Si das en adopción' }).getByRole('link')
  await expect(giver).toHaveCount(2)
  await expect(giver.nth(0)).toHaveAttribute('href', '/preguntas/antes-de-entregar')
  await expect(giver.nth(1)).toHaveAttribute('href', '/preguntas/que-exige-uruguay')
  const adopter = main.getByRole('region', { name: 'Si adoptás' }).getByRole('link')
  await expect(adopter).toHaveCount(2)
  await expect(adopter.nth(0)).toHaveAttribute('href', '/preguntas/reconocer-una-estafa')
  await expect(adopter.nth(1)).toHaveAttribute('href', '/preguntas/compromiso-y-seguimiento')
  const everyone = main.getByRole('region', { name: 'Para todos' }).getByRole('link')
  await expect(everyone).toHaveCount(1)
  await expect(everyone).toHaveAttribute('href', '/preguntas/como-se-verifica')

  const question = (await giver.nth(1).textContent()) ?? ''
  await giver.nth(1).click()
  await expect(page).toHaveURL(/\/preguntas\/que-exige-uruguay$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(question)
})

for (const slug of PAGES) {
  // Covers: US1-AS1, SC-002
  test(`a 390 × 844, la pregunta y la respuesta de ${slug} entran en la primera pantalla`, async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/preguntas/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expectAboveTheFold(page, 'h1')
    await expectAboveTheFold(page, 'p')
  })
}

// Covers: SC-003
test('los tres niveles dicen lo mismo en «Qué dice cada nivel» y en «Cómo se verifica»', async ({
  page,
}) => {
  await page.goto('/niveles')
  const levels = await ladder(page).innerText()
  await page.goto('/preguntas/como-se-verifica')
  expect(await ladder(page).innerText()).toBe(levels)
})
