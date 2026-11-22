import { expect, test, type Page } from '@playwright/test'
import { makePhotos, pick } from './support/big-photos'
import { removeRunOwner } from './support/listed-pets'
import { levelOneOwner, signIn } from './support/pet-owner'
import { expectAnswered, timeTap } from './support/tap-latency'
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

test('una foto de 12 MP está lista en menos de 5 s y publicar tres tarda menos de 30 s', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const owner = await levelOneOwner()
  await signIn(page, owner.email, PUBLISH)
  await expect(page).toHaveURL(new RegExp(PUBLISH))
  // Publicar empieza preguntando si es un animal o una camada (#205, FR-001).
  await page.getByRole('link', { name: 'Un animal', exact: true }).click()
  await expect(page).toHaveURL(/tipo=animal/)

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
  // Publicada queda a la vista en la portada, que Lighthouse mide después de esta etapa.
  await removeRunOwner(owner.id)
})

// Historia #313: mientras se preparan tres fotos de 12 megapíxeles, elegir «Gato» y escribir el
// nombre contestan en menos de 200 ms cada toque y cada letra, y las tres quedan listas igual. El
// nombre se vuelve a escribir hasta que las tres están listas: así cada medida cae mientras se
// preparan, también en una máquina que las prepara más rápido que un teléfono.
const NAME = 'Luna'

test('mientras se preparan tres fotos, elegir «Gato» y escribir «Luna» contestan en menos de 200 ms', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const owner = await levelOneOwner()
  await signIn(page, owner.email, PUBLISH)
  await expect(page).toHaveURL(new RegExp(PUBLISH))
  await page.getByRole('link', { name: 'Un animal', exact: true }).click()
  await expect(page).toHaveURL(/tipo=animal/)
  await makePhotos(page, 3)
  await throttleLikeAPhone(page)
  const photos = page.getByRole('img', { name: /^Foto \d$/ })
  const name = page.getByRole('textbox', { name: 'Nombre' })

  const photosStart = Date.now()
  await pick(page, 0, 3)
  expect(await photos.count(), 'fotos listas al tocar «Gato»').toBeLessThan(3)
  const cat = await timeTap(
    page,
    '«Gato» con tres fotos preparándose',
    () => choose(page, 'Especie', 'Gato'),
    [{ selector: 'input[type=radio]', value: 'cat', checked: true }],
  )
  expectAnswered('«Gato» con tres fotos preparándose', cat)

  do {
    // oxlint-disable-next-line no-await-in-loop -- una vuelta del nombre por vez
    await name.fill('')
    let typed = ''
    for (const letter of NAME) {
      typed += letter
      // oxlint-disable-next-line no-await-in-loop -- letra por letra, como se escribe
      const ms = await timeTap(
        page,
        `La «${letter}» de «${NAME}» con fotos preparándose`,
        () => page.keyboard.press(letter),
        [{ selector: 'input', value: typed }],
      )
      expectAnswered(`La «${letter}» de «${NAME}» con fotos preparándose`, ms)
    }
    // oxlint-disable-next-line no-await-in-loop
  } while ((await photos.count()) < 3 && Date.now() - photosStart < 3 * PHOTO_READY_MS)

  await expect(photos).toHaveCount(3)
  await expect(name).toHaveValue(NAME)
  expect(Date.now() - photosStart, 'tres fotos de 12 MP listas, en ms').toBeLessThan(
    3 * PHOTO_READY_MS,
  )
  await removeRunOwner(owner.id)
})
