import { expect, test, type Page } from '@playwright/test'
import { levelOneOwner, signIn } from './support/pet-owner'
import { throttleLikeAPhone } from './support/web-vitals'

// SC-001 y SC-002 en lo que la corrida puede medir, con la red y la CPU de un teléfono de gama
// media emuladas: cada foto de 12 megapíxeles lista en menos de 5 segundos, y publicar tres en
// menos de 30. Los umbrales son los de la spec, sin margen: si no se sostienen, es un hallazgo de
// rendimiento, no un test para aflojar.
const PUBLISH = '/mis-animales/publicar'
const PHOTO_READY_MS = 5_000
const PUBLISH_MS = 30_000
const KB = 1024

function choose(page: Page, group: string, option: string) {
  return page
    .getByRole('group', { name: group })
    .getByRole('radio', { name: option, exact: true })
    .check()
}

// Una foto de 4000 × 3000 que se comprime como una foto y no como ruido puro, que es el peor caso de
// WebP: degradés y formas con un ruido leve. Se arma en la página, sin un archivo de megas en el
// repo, y devuelve cuánto pesaría su tamaño `full` para comprobar que la medición es representativa.
async function makePhotos(page: Page, count: number): Promise<number> {
  return page.evaluate(async (total) => {
    const canvas = document.createElement('canvas')
    canvas.width = 4000
    canvas.height = 3000
    const context = canvas.getContext('2d')
    if (context === null) return 0
    const files: File[] = []
    let fullBytes = 0
    for (let index = 0; index < total; index += 1) {
      const gradient = context.createLinearGradient(0, 0, 4000, 3000)
      gradient.addColorStop(0, `hsl(${30 + index * 40} 45% 55%)`)
      gradient.addColorStop(1, `hsl(${150 + index * 30} 35% 30%)`)
      context.fillStyle = gradient
      context.fillRect(0, 0, 4000, 3000)
      for (let shape = 0; shape < 40; shape += 1) {
        context.fillStyle = `hsl(${(shape * 37) % 360} 40% ${30 + (shape % 5) * 10}% / 0.6)`
        context.beginPath()
        context.arc(
          (shape * 997) % 4000,
          (shape * 613) % 3000,
          80 + (shape % 7) * 60,
          0,
          Math.PI * 2,
        )
        context.fill()
      }
      // Grano en bloques de 4 px: sobrevive a la reducción a 1600 como el de una foto real.
      const pixels = context.getImageData(0, 0, 4000, 3000)
      for (let y = 0; y < 3000; y += 4) {
        for (let x = 0; x < 4000; x += 4) {
          const noise = (Math.random() - 0.5) * 32
          for (let dy = 0; dy < 4; dy += 1) {
            for (let dx = 0; dx < 4; dx += 1) {
              const offset = ((y + dy) * 4000 + x + dx) * 4
              pixels.data[offset] += noise
              pixels.data[offset + 1] += noise
              pixels.data[offset + 2] += noise
            }
          }
        }
      }
      context.putImageData(pixels, 0, 0)
      // oxlint-disable-next-line no-await-in-loop -- un solo canvas, reusado foto por foto
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
      )
      if (blob === null) return 0
      files.push(new File([blob], `IMG_${index}.jpg`, { type: 'image/jpeg' }))

      if (index === 0) {
        const full = document.createElement('canvas')
        full.width = 1600
        full.height = 1200
        full.getContext('2d')?.drawImage(canvas, 0, 0, 1600, 1200)
        // oxlint-disable-next-line no-await-in-loop -- solo en la primera vuelta
        const webp = await new Promise<Blob | null>((resolve) =>
          full.toBlob(resolve, 'image/webp', 0.82),
        )
        fullBytes = webp?.size ?? 0
      }
    }
    Reflect.set(window, '__photos', files)
    return fullBytes
  }, count)
}

// Por `DataTransfer`, como si se hubieran elegido de la galería.
async function pick(page: Page, from: number, to: number) {
  await page.evaluate(
    ({ start, end }) => {
      const files: unknown = Reflect.get(window, '__photos')
      const input = document.querySelector('input[type=file]')
      if (!Array.isArray(files) || !(input instanceof HTMLInputElement)) return
      const transfer = new DataTransfer()
      for (const file of files.slice(start, end)) {
        if (file instanceof File) transfer.items.add(file)
      }
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { start: from, end: to },
  )
}

test('una foto de 12 MP está lista en menos de 5 s y publicar tres tarda menos de 30 s', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const owner = await levelOneOwner()
  await signIn(page, owner.email, PUBLISH)
  await expect(page).toHaveURL(new RegExp(PUBLISH))

  const fullBytes = await makePhotos(page, 3)
  expect(fullBytes, 'el full de la foto de prueba, en bytes').toBeGreaterThanOrEqual(300 * KB)
  expect(fullBytes, 'el full de la foto de prueba, en bytes').toBeLessThanOrEqual(500 * KB)

  await page.getByRole('textbox', { name: 'Nombre' }).fill('Medida')
  await choose(page, 'Especie', 'Gato')
  await choose(page, 'Sexo', 'Macho')
  await page.getByRole('textbox', { name: 'Edad aproximada, en números' }).fill('3')
  await choose(page, 'Unidad de la edad', 'Años')
  await choose(page, 'Tamaño de adulto', 'Chico')
  await choose(page, 'Castrado', 'Sí')
  await choose(page, 'Vacunas', 'Al día')
  await choose(page, 'Chip', 'No')

  await throttleLikeAPhone(page)

  const photoStart = Date.now()
  await pick(page, 0, 1)
  await expect(page.getByRole('img', { name: 'Foto 1' })).toBeVisible({ timeout: 60_000 })
  expect(Date.now() - photoStart, 'una foto de 12 MP lista, en ms').toBeLessThan(PHOTO_READY_MS)

  await pick(page, 1, 3)
  await expect(page.getByRole('img', { name: /^Foto \d$/ })).toHaveCount(3, { timeout: 60_000 })

  const publishStart = Date.now()
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page.getByText('Publicado', { exact: true })).toBeVisible({ timeout: 120_000 })
  expect(Date.now() - publishStart, 'publicar tres fotos, en ms').toBeLessThan(PUBLISH_MS)
})
