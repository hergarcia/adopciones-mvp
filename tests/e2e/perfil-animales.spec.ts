import { expect, test } from '@playwright/test'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'

// Los animales en adopción de cada rescatista en su perfil (historia #238), contra el build de
// producción y con una rescatista propia de la corrida.

// Covers: US1-AS1, US1-AS2, US1-AS3
test('desde la ficha, el perfil de quien publicó muestra sus animales y lleva a otra ficha', async ({
  page,
}) => {
  const { owner, pets } = await publishForRun([
    { name: 'Tobi', species: 'dog' },
    { name: 'Luna', species: 'dog' },
  ])
  const litter = await publishLitterForRun(owner.id, 5)
  const [tobi, luna] = pets
  try {
    await page.goto(`/animales/${tobi.code}`)
    await page.getByRole('link', { name: 'Ana Prueba' }).click()
    await expect(page).toHaveURL(/\/perfil\/[\w-]{22}$/)

    const section = page.getByRole('region', { name: 'En adopción' })
    const cards = section.locator('li[id^="a-"]')
    await expect(cards).toHaveCount(3)
    await expect(section.locator(`a[href$="/camadas/${litter.code}"]`)).toHaveCount(1)
    await expect(section.locator(`a[href$="/animales/${tobi.code}"]`)).toHaveCount(1)

    await section.locator(`a[href$="/animales/${luna.code}"]`).click()
    await expect(page).toHaveURL(new RegExp(`/animales/${luna.code}$`))
    await expect(page.getByRole('heading', { level: 1, name: 'Luna' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Quiero adoptar' })).toBeVisible()
  } finally {
    await removeRunOwner(owner.id)
  }
})
