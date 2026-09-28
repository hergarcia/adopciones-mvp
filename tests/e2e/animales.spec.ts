import { expect, test } from '@playwright/test'
import { publishForRun } from './support/listed-pets'

// Los flujos críticos de la historia #57, contra el build de producción, con animales propios de la
// corrida (research R14).

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

// Flujo 1 (US1, US2): el enlace sin sesión, como lo abre quien llega desde Facebook y como lo lee
// WhatsApp para armar la vista previa.
test('el enlace de un animal se abre sin sesión y trae su vista previa', async ({ page }) => {
  const name = `Tobi ${suffix()}`
  const {
    pets: [tobi],
  } = await publishForRun([{ name, species: 'dog', department: 'UY-MO', locality: 'Pocitos' }])

  await page.goto(`/animales/${tobi.code}`)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(page.getByText('Teléfono verificado')).toBeVisible()
  await expect(page.getByText('Ana Prueba')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Compartir' })).toBeVisible()

  const html = await (await page.request.get(`/animales/${tobi.code}`)).text()
  const meta = (property: string) =>
    html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1]
  expect(meta('og:title')).toBe(`${name} en adopción`)
  expect(meta('og:description')).toBe('Pocitos, Montevideo')
  const image = meta('og:image') ?? ''
  expect(image).toMatch(new RegExp(`/animales/${tobi.code}/imagen\\?v=[0-9a-f]+$`))

  const response = await page.request.get(new URL(image).pathname + new URL(image).search)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/jpeg')
  expect((await response.body()).length).toBeLessThan(300 * 1024)
})
