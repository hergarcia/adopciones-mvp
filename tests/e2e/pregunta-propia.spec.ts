import { expect, test, type Page } from '@playwright/test'
import { photoWithGps } from './support/exif-fixture'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { levelOneOwner, service, signIn } from './support/pet-owner'

// La pregunta propia de quien publica (historia #292), de punta a punta: se escribe al publicar, la
// ficha no la muestra, quien solicita la contesta en el cuestionario y las dos puntas la leen en la
// solicitud. La pantalla de identidad pedida, que llega antes del cuestionario, no la trae.
const PUBLISH = '/mis-animales/publicar'
const QUESTION = 'Kira toma una pastilla dos veces por día. ¿Podés dársela en horario?'
const ANSWER = 'Sí, a las 8 y a las 20: trabajo desde casa.'

function suffix(): string {
  return Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
}

const group = (page: Page, legend: string) => page.getByRole('group', { name: legend })

async function choose(page: Page, legend: string, option: string) {
  await group(page, legend).getByRole('radio', { name: option, exact: true }).check()
}

async function next(page: Page) {
  await page.getByRole('button', { name: 'Siguiente' }).click()
}

async function answer(page: Page, legend: string, option: string) {
  await choose(page, legend, option)
  await next(page)
}

async function write(page: Page, label: string, text: string) {
  await page.getByRole('textbox', { name: label }).fill(text)
  await next(page)
}

async function publishKira(page: Page, name: string) {
  await page.getByRole('link', { name: 'Un animal', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nombre' }).fill(name)
  await choose(page, 'Especie', 'Perro')
  await choose(page, 'Sexo', 'Hembra')
  await page.getByRole('textbox', { name: 'Edad aproximada, en números' }).fill('2')
  await choose(page, 'Unidad de la edad', 'Años')
  await choose(page, 'Tamaño de adulto', 'Mediano')
  await choose(page, 'Castrado', 'Sí')
  await choose(page, 'Vacunas', 'Al día')
  await choose(page, 'Chip', 'No')
  await page
    .getByRole('textbox', { name: 'Tu pregunta para quien quiera adoptarlo' })
    .fill(QUESTION)
  await page
    .locator('input[type=file]')
    .setInputFiles([
      { name: 'kira.jpg', mimeType: 'image/jpeg', buffer: await photoWithGps(page, 400, 500) },
    ])
  await expect(page.getByRole('img', { name: /^Foto \d$/ })).toHaveCount(1)
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page).toHaveURL(/\/mis-animales(\?guardado=publicado)?$/, { timeout: 30_000 })
}

async function codeOf(ownerId: string): Promise<string> {
  const { data, error } = await service().from('pets').select('code').eq('owner_id', ownerId)
  expect(error).toBeNull()
  expect(data).toHaveLength(1)
  return String(data?.[0]?.code ?? '')
}

// Covers: #292 US1-AS1, US1-AS2, FR-003, FR-010, FR-017
test('la pregunta de Kira: se escribe al publicar, se contesta al solicitar y se lee de los dos lados', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const owner = await levelOneOwner()
  const adopter = await newPerson('Lucía Prueba', { level: 1 })
  const name = `Kira ${suffix()}`
  const adopterContext = await browser.newContext()
  const asAdopter = await adopterContext.newPage()
  try {
    await signIn(page, owner.email, PUBLISH)
    await publishKira(page, name)
    const code = await codeOf(owner.id)

    // La ficha se ve como siempre, sin la pregunta.
    await page.goto(new URL(`/animales/${code}`, page.url()).href)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(page.getByText(QUESTION)).toHaveCount(0)

    await signIn(asAdopter, adopter.email, `/solicitar/${code}`)
    await expect(asAdopter.getByText('1 de 11', { exact: true })).toBeVisible()
    await answer(asAdopter, '¿Dónde vivís?', 'Apartamento')
    await answer(asAdopter, '¿Es propia o alquilada?', 'Propia')
    await answer(asAdopter, '¿Tenés patio o balcón?', 'Balcón con red')
    await write(asAdopter, '¿Quiénes viven en la casa?', 'Mi pareja y yo.')
    await write(asAdopter, '¿Hay otros animales en la casa?', 'Ninguno.')
    await answer(asAdopter, '¿Cuántas horas por día estaría sin compañía?', 'De 4 a 8')
    await write(asAdopter, '¿Qué pasa con el animal si te mudás o te vas de viaje?', 'Se viene.')
    await write(asAdopter, '¿Tuviste perros o gatos antes?', 'Una perra, doce años.')
    await answer(
      asAdopter,
      '¿Contás con plata para vacunas, castración y una urgencia del veterinario?',
      'Justo',
    )

    // Justo antes de «¿Por qué?», con el nombre de quien publicó; vacía no deja seguir.
    await expect(asAdopter.getByText('10 de 11', { exact: true })).toBeVisible()
    await expect(asAdopter.getByText('La pregunta de Ana Prueba', { exact: true })).toBeVisible()
    await next(asAdopter)
    await expect(asAdopter.getByText('10 de 11', { exact: true })).toBeVisible()
    await write(asAdopter, QUESTION, ANSWER)
    await expect(asAdopter.getByRole('textbox', { name: `¿Por qué ${name}?` })).toBeVisible()
    await asAdopter.getByRole('textbox', { name: `¿Por qué ${name}?` }).fill('Porque es tranquila.')
    await asAdopter.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(asAdopter).toHaveURL(/\/enviada\?solicitud=/)
    const id = new URL(asAdopter.url()).searchParams.get('solicitud') ?? ''

    // Quien solicitó la ve en su solicitud.
    await asAdopter.goto(new URL(`/mis-solicitudes/${id}`, asAdopter.url()).href)
    await expect(asAdopter.getByText(QUESTION, { exact: true })).toBeVisible()
    await expect(asAdopter.getByText(ANSWER, { exact: true })).toBeVisible()

    // Quien publicó, en la misma pantalla que el resto del cuestionario.
    await page.goto(new URL(`/solicitudes/${id}`, page.url()).href)
    await expect(page.getByText('Mi pareja y yo.', { exact: true })).toBeVisible()
    await expect(page.getByText(QUESTION, { exact: true })).toBeVisible()
    await expect(page.getByText(ANSWER, { exact: true })).toBeVisible()
  } finally {
    await adopterContext.close()
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})

// Covers: #292 FR-010 (la pregunta no llega a una pantalla de freno)
test('la pantalla de identidad pedida de un animal con pregunta no la trae', async ({ page }) => {
  const { owner, pets } = await publishForRun([{ name: 'Kira', species: 'dog', isNeutered: true }])
  const code = pets[0]?.code ?? ''
  const adopter = await newPerson('Lucía Prueba', { level: 1 })
  try {
    const { error } = await service()
      .from('pets')
      .update({ own_question: QUESTION, required_level: 2 })
      .eq('code', code)
    expect(error).toBeNull()
    await signIn(page, adopter.email, `/solicitar/${code}`)
    await expect(page.getByText(/identidad/i).first()).toBeVisible()
    expect(await page.content()).not.toContain(QUESTION)
  } finally {
    await removePerson(adopter)
    await removeRunOwner(owner.id)
  }
})
