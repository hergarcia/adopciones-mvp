import { expect, test, type Page } from '@playwright/test'
import { CAMERA_MAKE, CAMERA_MODEL, photoWithGps } from './support/exif-fixture'
import { removeRunOwner } from './support/listed-pets'
import { levelOneOwner, service, signIn } from './support/pet-owner'

// El flujo crítico de la historia #53, contra el build de producción: una rescatista con nivel 1
// carga un animal, recarga a mitad y recupera lo escrito, elige tres fotos sacadas «con el
// teléfono», cambia la portada, se queda sin conexión al publicar sin perder nada, vuelve la
// conexión, toca dos veces y termina con una sola publicación. Después se bajan las fotos
// guardadas: ni ubicación, ni cámara, ni el nombre del archivo (SC-003, SC-004, SC-006).
const PUBLISH = '/mis-animales/publicar'

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

function choose(page: Page, group: string, option: string) {
  return page
    .getByRole('group', { name: group })
    .getByRole('radio', { name: option, exact: true })
    .check()
}

async function fillRequired(page: Page, name: string) {
  await page.getByRole('textbox', { name: 'Nombre' }).fill(name)
  await choose(page, 'Especie', 'Perro')
  await choose(page, 'Sexo', 'Hembra')
  await page.getByRole('textbox', { name: 'Edad aproximada, en números' }).fill('2')
  await choose(page, 'Unidad de la edad', 'Meses')
  await choose(page, 'Tamaño de adulto', 'Mediano')
  await choose(page, 'Castrado', 'Sí')
  await choose(page, 'Vacunas', 'Al día')
  await choose(page, 'Chip', 'No')
}

test('publicar con fotos de teléfono, sin conexión y con doble toque deja una sola publicación', async ({
  page,
  context,
}) => {
  const owner = await levelOneOwner()
  const name = `Luna ${suffix()}`
  await signIn(page, owner.email, PUBLISH)
  await expect(page).toHaveURL(new RegExp(PUBLISH))

  // Lo escrito sobrevive a una recarga, y la zona del perfil viene propuesta (SC-006, US1-AS2).
  await fillRequired(page, name)
  await expect(page.getByRole('combobox', { name: 'Barrio' })).toHaveValue('Pocitos')
  await page.reload()
  await expect(page.getByText(/recuperamos lo que habías escrito/i)).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nombre' })).toHaveValue(name)
  await expect(
    page.getByRole('group', { name: 'Chip' }).getByRole('radio', { name: 'No' }),
  ).toBeChecked()

  // Tres fotos con GPS y cámara, y un nombre de archivo propio; la segunda, vertical, de portada.
  const files = await Promise.all(
    [
      [600, 400],
      [400, 600],
      [500, 500],
    ].map(async ([width, height], index) => ({
      name: `IMG_2026_ana_${index}.jpg`,
      mimeType: 'image/jpeg',
      buffer: await photoWithGps(page, width, height),
    })),
  )
  await page.locator('input[type=file]').setInputFiles(files)
  await expect(page.getByRole('img', { name: /^Foto \d$/ })).toHaveCount(3)
  await expect(page.getByText('3 de 5 fotos')).toBeVisible()
  await page.getByRole('button', { name: 'Hacer portada' }).first().click()

  // Sin conexión no se publica, se dice por qué y todo sigue en pantalla, fotos incluidas (FR-021).
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page.getByText(/no se publicó porque no hay conexión/i)).toBeVisible()
  await expect(page.getByRole('img', { name: /^Foto \d$/ })).toHaveCount(3)
  await expect(page.getByRole('textbox', { name: 'Nombre' })).toHaveValue(name)

  // Con conexión, dos toques: una sola publicación (SC-004).
  await context.setOffline(false)
  await page.getByRole('button', { name: 'Publicar', exact: true }).dblclick()
  await expect(page).toHaveURL(/\/mis-animales\?guardado=publicado|\/mis-animales$/, {
    timeout: 30_000,
  })
  await expect(page.getByText('Publicado', { exact: true })).toBeVisible()
  await expect(page.getByRole('link').filter({ hasText: name }).first()).toBeVisible()

  const db = service()
  const pets = await db.from('pets').select('id').eq('owner_id', owner.id)
  expect(pets.data).toHaveLength(1)
  const photos = await db
    .from('pet_photos')
    .select('id, position, width, height')
    .eq('pet_id', pets.data?.[0]?.id ?? '')
    .order('position')
  expect(photos.data?.map((photo) => photo.position)).toEqual([0, 1, 2])
  expect(photos.data?.[0]).toMatchObject({ width: 400, height: 600 })

  // Lo guardado es WebP, se llama como su tamaño y no trae nada de la cámara (SC-003, FR-008).
  const cover = photos.data?.[0]?.id ?? ''
  const bucket = db.storage.from('pet-photos')
  const listed = await bucket.list(`${owner.id}/${cover}`)
  expect(listed.data?.map((file) => file.name).sort((a, b) => a.localeCompare(b))).toEqual([
    'card.webp',
    'full.webp',
    'thumb.webp',
  ])
  for (const size of ['thumb', 'card', 'full']) {
    // oxlint-disable-next-line no-await-in-loop -- tres archivos, uno detrás del otro
    const { data } = await bucket.download(`${owner.id}/${cover}/${size}.webp`)
    // oxlint-disable-next-line no-await-in-loop
    const bytes = Buffer.from((await data?.arrayBuffer()) ?? new ArrayBuffer(0))
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('RIFF')
    expect(bytes.subarray(8, 12).toString('latin1')).toBe('WEBP')
    expect(bytes.includes('Exif')).toBe(false)
    expect(bytes.includes(CAMERA_MAKE)).toBe(false)
    expect(bytes.includes(CAMERA_MODEL)).toBe(false)
    expect(bytes.includes('IMG_2026_ana')).toBe(false)
  }
  // Publicada queda a la vista en la portada, que Lighthouse mide después de esta etapa.
  await removeRunOwner(owner.id)
})
