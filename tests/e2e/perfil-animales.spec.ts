import { expect, test } from '@playwright/test'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { service, signIn } from './support/pet-owner'

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
    // La invitación a sus otros animales lleva a «En adopción» del perfil (historia #242).
    await expect(
      page.getByRole('link', { name: 'Ver sus otros animales en adopción' }),
    ).toHaveAttribute('href', /\/perfil\/[\w-]{22}#en-adopcion$/)
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

// En una computadora, donde el botón copia en vez de abrir la hoja de compartir.
test.describe('el enlace del perfil en «Mis animales», en una computadora', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

  // Covers: US2-AS1, US2-AS2
  test('copia el enlace del perfil y avisa', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const { owner } = await publishForRun([{ name: 'Tobi', species: 'dog' }])
    try {
      const { data } = await service()
        .from('profiles')
        .select('public_id')
        .eq('id', owner.id)
        .single()
      const publicId = data?.public_id ?? ''
      expect(publicId).toHaveLength(22)

      await signIn(page, owner.email, '/mis-animales')
      await expect(page).toHaveURL(/\/mis-animales$/)
      await expect(
        page.getByText('En el enlace de tu perfil se ven todos tus animales en adopción.'),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Copiar el enlace' }).click()
      await expect(page.getByText('Enlace copiado', { exact: true })).toBeVisible()
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
        new RegExp(`/perfil/${publicId}$`),
      )
    } finally {
      await removeRunOwner(owner.id)
    }
  })
})
