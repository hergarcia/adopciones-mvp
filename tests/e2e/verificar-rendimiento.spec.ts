import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type FileChooser, type Locator, type Page } from '@playwright/test'
import sharp from 'sharp'
import { CAMERA_MAKE, CAMERA_MODEL, withCameraExif } from './support/exif-fixture'
import { codeFor, codesSentTo } from './support/mailbox'
import { scriptWeight, withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import { uniqueTypedNumber } from './support/phone-number'
import {
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  measure,
  type Measured,
} from './support/screen-budget'
import { settled, slowActions } from './support/slow-server'
import { expectAnswered, timeTap, watchLongestTask, type Answer } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #322: las pantallas de verificar el teléfono y la identidad entran al presupuesto del
// camino a adoptar (docs/07 §Presupuesto de performance), con red y procesador de teléfono de gama
// media. Los totales de `main` antes de #322, iguales en dos corridas: impiden esconder peso de
// apertura corriéndolo a después de abrir.
const PHONE_TOTAL_KB = 180.7
const CODE_TOTAL_KB = 181.2
const IDENTITY_TOTAL_KB = 185.1

const PHONE = '/verificar-telefono'
const IDENTITY = '/verificar-identidad'
const PHOTO_READY_MS = 60_000
// El tope de cada foto procesada (IDENTITY_PHOTO_TARGET_BYTES) y el de la base.
const PROCESSED_MAX_BYTES = 450 * 1024
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

// Cada foto tiene sus dos botones de cámara; el de la cámara de atrás es el del frente.
const FRONT = 'section:has(input[capture="environment"])'
const SELFIE = 'section:has(input[capture="user"])'
const waitIn = (photo: string) => `${photo} .shimmer`
const noticeIn = (photo: string) => `${photo} [role="alert"]`

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

// Una foto de cédula sacada con un teléfono de 12 megapíxeles: 4000 × 3000, con grano y con la marca,
// el modelo y la ubicación en el EXIF, que tienen que desaparecer antes de salir del teléfono.
async function phonePhoto(hue: number): Promise<Buffer> {
  const jpeg = await sharp({
    create: {
      width: 4000,
      height: 3000,
      channels: 3,
      background: { r: hue, g: 110, b: 255 - hue },
      noise: { type: 'gaussian', mean: 128, sigma: 16 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer()
  return withCameraExif(jpeg)
}

// En disco y no en memoria: Playwright arma en la página el archivo que recibe en memoria, y con
// una foto de megas eso ocupaba el hilo de la página 2 segundos que no son del producto. Fuera de
// `test-results`: Chromium no elige un archivo cuya ruta tiene «comillas» como las de los títulos.
function onDisk(name: string, bytes: Buffer): string {
  const path = join(mkdtempSync(join(tmpdir(), 'verificar-')), name)
  writeFileSync(path, bytes)
  return path
}

// Tocar un botón que abre la galería: contesta cuando el navegador la abre, y la galería queda
// abierta para elegir después.
async function chooseTap(page: Page, name: string, button: Locator): Promise<FileChooser> {
  await expect(button).toBeEnabled()
  const chooser = page.waitForEvent('filechooser')
  expectAnswered(name, await timeTap(page, name, () => button.click(), []))
  return chooser
}

// Elegir en la galería abierta: el reloj arranca con el `change` del campo.
async function pickTap(
  page: Page,
  name: string,
  chooser: FileChooser,
  path: string,
  answer: Answer[],
) {
  expectAnswered(name, await timeTap(page, name, () => chooser.setFiles(path), answer))
}

async function expectPreparing(page: Page, photo: string, what: string) {
  expect(await page.locator(waitIn(photo)).isVisible(), `${what} todavía se preparaba`).toBe(true)
}

// Lo que sale de una foto preparada: WebP o JPEG, dentro del tope y sin nada del EXIF.
function expectProcessed(what: string, bytes: Buffer) {
  const text = bytes.toString('latin1')
  const isWebp = text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP'
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  expect(isWebp || isJpeg, `${what}: WebP o JPEG`).toBe(true)
  expect(bytes.length, `${what}, en bytes`).toBeLessThanOrEqual(PROCESSED_MAX_BYTES)
  expect(text.includes(CAMERA_MAKE), `${what}: sin la marca de la cámara`).toBe(false)
  expect(text.includes(CAMERA_MODEL), `${what}: sin el modelo de la cámara`).toBe(false)
  expect(text.includes('Exif'), `${what}: sin EXIF`).toBe(false)
}

async function previewBytes(page: Page, alt: string): Promise<Buffer> {
  const base64 = await page.getByRole('img', { name: alt }).evaluate(async (image) => {
    if (!(image instanceof HTMLImageElement)) return ''
    const bytes = new Uint8Array(await (await fetch(image.src)).arrayBuffer())
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
  })
  return Buffer.from(base64, 'base64')
}

async function sentImages(person: Person): Promise<Buffer[]> {
  const { data } = await service()
    .from('identity_requests')
    .select('identity_request_images(data)')
    .eq('user_id', person.id)
    .single()
  const images: unknown = Reflect.get(data ?? {}, 'identity_request_images')
  if (!Array.isArray(images)) return []
  return images.map((image) => {
    const hex = String(Reflect.get(image ?? {}, 'data') ?? '')
    return Buffer.from(hex.replace(/^\\x/, ''), 'hex')
  })
}

// Escribe letra por letra, como en el teclado del teléfono, y cada una tiene que verse en 200 ms.
async function typeTimed(page: Page, field: string, text: string, what: string) {
  let typed = ''
  for (const char of text) {
    typed += char
    const name = `«${char}» de «${text}» en ${what}`
    // oxlint-disable-next-line no-await-in-loop -- letra por letra, como se escribe
    const ms = await timeTap(page, name, () => page.keyboard.type(char), [
      { selector: field, value: typed },
    ])
    expectAnswered(name, ms)
  }
}

test('verificar el teléfono, el código y la identidad abren dentro de los 150 KB', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const newcomer = await newPerson('Marta Prueba', { level: 0 })
  const adopter = await newPerson('Dani Prueba', { level: 1 })
  const phone = uniqueTypedNumber()
  try {
    await signIn(page, newcomer.email, PHONE)
    await expect(page.getByRole('button', { name: 'Mandarme el código' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)

    expectWithin('«Verificá tu teléfono»', await measure(page, `${origin}${PHONE}`), PHONE_TOTAL_KB)

    await expect(page.getByRole('button', { name: 'Mandarme el código' })).toBeEnabled()
    await page.getByRole('textbox').fill(phone.typed)
    await page.getByRole('button', { name: 'Mandarme el código' }).click()
    await expect(page).toHaveURL(/verificar-telefono\/codigo/, { timeout: 30_000 })
    expectWithin(
      '«Escribí el código»',
      await measure(page, `${origin}${PHONE}/codigo`),
      CODE_TOTAL_KB,
    )

    await page.context().clearCookies()
    await signIn(page, adopter.email, IDENTITY)
    await expect(page.getByRole('button', { name: 'Acepto y elijo las fotos' })).toBeVisible({
      timeout: 30_000,
    })
    const identity = await measure(page, `${origin}${IDENTITY}`)
    expectWithin('«Verificá tu identidad»', identity, IDENTITY_TOTAL_KB)

    await page.getByRole('button', { name: 'Acepto y elijo las fotos' }).click()
    await expect(page.getByRole('button', { name: 'Elegir foto' }).first()).toBeVisible()
    const accepted = { ...identity, ...(await scriptWeight(page)) }
    test.info().annotations.push({
      type: 'rendimiento',
      description: `${IDENTITY} después de aceptar: JS total ${(accepted.total / 1024).toFixed(1)} KB`,
    })
    expectTotalWithin(
      '«Verificá tu identidad» después de «Acepto y elijo las fotos»',
      accepted,
      IDENTITY_TOTAL_KB,
    )
  } finally {
    await removePerson(newcomer)
    await removePerson(adopter)
  }
})

test('«Verificá tu teléfono» y «Escribí el código» contestan cada toque en menos de 200 ms, con la señal mala', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const person = await newPerson('Marta Prueba', { level: 0 })
  const phone = uniqueTypedNumber()
  try {
    await signIn(page, person.email, PHONE)
    await expect(page.getByRole('button', { name: 'Mandarme el código' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    const actions = await slowActions(page)
    await settled(page, `${origin}${PHONE}`)

    await page.getByRole('textbox').click()
    await typeTimed(page, 'input[type="tel"]', phone.typed, '«Verificá tu teléfono»')

    actions.reset()
    const send = page.getByRole('button', { name: 'Mandarme el código' })
    const sent = await timeTap(
      page,
      '«Mandarme el código» tocado dos veces',
      () => send.dblclick(),
      [{ selector: 'button[aria-busy="true"]', text: 'Mandarme el código' }],
    )
    expectAnswered('«Mandarme el código» tocado dos veces', sent)
    await expect(page).toHaveURL(/verificar-telefono\/codigo/, { timeout: 30_000 })
    expect(actions.count(), '«Mandarme el código» tocado dos veces, pedidos que salieron').toBe(1)
    expect(codesSentTo(phone.e164), 'códigos que salieron').toBe(1)

    // El reenvío espera un minuto después del primer código: se corre el pedido para no esperarlo.
    const { error } = await service()
      .from('phone_codes')
      .update({ requested_at: new Date(Date.now() - 120_000).toISOString() })
      .eq('user_id', person.id)
    expect(error).toBeNull()
    await settled(page, page.url())

    actions.reset()
    const resend = page.getByRole('button', { name: 'Mandarme otro código' })
    await expect(resend).toBeEnabled()
    const resent = await timeTap(page, '«Mandarme otro código»', () => resend.click(), [
      { selector: 'button[aria-busy="true"]', text: 'Mandarme otro código' },
    ])
    expectAnswered('«Mandarme otro código»', resent)
    await expect(page.getByText(`Te mandamos otro código al ${phone.typed}.`)).toBeVisible({
      timeout: 30_000,
    })
    expect(actions.count(), '«Mandarme otro código», pedidos que salieron').toBe(1)
    await expect.poll(() => codesSentTo(phone.e164)).toBe(2)

    await page.getByRole('textbox').click()
    await typeTimed(page, 'input[inputmode="numeric"]', codeFor(phone.e164), '«Escribí el código»')
    // Con el sexto número se revisa solo, sin tocar «Verificar» (#308).
    await expect(page.locator('button[aria-busy="true"]', { hasText: 'Verificar' })).toBeVisible()
    await expect(page).toHaveURL(/\/mi-perfil(\?|$)/, { timeout: 30_000 })
  } finally {
    await removePerson(person)
  }
})

test('«Verificá tu identidad» contesta cada toque en menos de 200 ms mientras se preparan fotos de 12 MP', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const person = await newPerson('Dani Prueba', { level: 1 })
  const photos = await Promise.all([40, 90, 140, 190].map((hue) => phonePhoto(hue)))
  for (const photo of photos) {
    expect(photo.length, 'una foto de prueba, en bytes').toBeLessThan(MAX_PHOTO_BYTES)
  }
  const [frontPhoto, selfiePhoto, newSelfie, newFront] = photos.map((photo, index) =>
    onDisk(`IMG_2026_${index}.jpg`, photo),
  )
  try {
    await signIn(page, person.email, IDENTITY)
    await expect(page.getByRole('button', { name: 'Acepto y elijo las fotos' })).toBeVisible({
      timeout: 30_000,
    })
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    const actions = await slowActions(page)
    await settled(page, `${origin}${IDENTITY}`)

    const accept = page.getByRole('button', { name: 'Acepto y elijo las fotos' })
    expectAnswered(
      '«Acepto y elijo las fotos»',
      await timeTap(page, '«Acepto y elijo las fotos»', () => accept.click(), [
        { selector: 'button', text: 'Elegir foto' },
      ]),
    )
    const front = page.locator(FRONT)
    const selfie = page.locator(SELFIE)
    const choose = (photo: Locator) => photo.getByRole('button', { name: 'Elegir foto' })
    const change = (photo: Locator) => photo.getByRole('button', { name: 'Cambiar foto' })
    const frontPreview = page.getByRole('img', {
      name: 'El frente de tu cédula, antes de enviarlo',
    })
    const selfiePreview = page.getByRole('img', {
      name: 'Tu selfie con la cédula, antes de enviarla',
    })

    let longestTask = await watchLongestTask(page)
    let chooser = await chooseTap(page, '«Elegir foto» del frente', choose(front))
    await pickTap(page, 'el marco del frente al elegir la foto', chooser, frontPhoto, [
      { selector: waitIn(FRONT) },
    ])
    await expectPreparing(page, FRONT, 'el frente')
    chooser = await chooseTap(
      page,
      '«Elegir foto» de la selfie mientras se prepara el frente',
      choose(selfie),
    )
    await pickTap(page, 'el marco de la selfie al elegir la foto', chooser, selfiePhoto, [
      { selector: waitIn(SELFIE) },
    ])
    await expect(frontPreview).toBeVisible({ timeout: PHOTO_READY_MS })
    await expect(selfiePreview).toBeVisible({ timeout: PHOTO_READY_MS })

    const whilePreparing = 'un toque cualquiera mientras se preparan el frente y la selfie'
    expectAnswered(whilePreparing, await longestTask(whilePreparing))

    longestTask = await watchLongestTask(page)
    chooser = await chooseTap(page, '«Cambiar foto» de la selfie', change(selfie))
    await pickTap(page, 'el marco de la selfie al cambiar la foto', chooser, newSelfie, [
      { selector: waitIn(SELFIE) },
    ])
    await expectPreparing(page, SELFIE, 'la selfie')
    chooser = await chooseTap(
      page,
      '«Cambiar foto» del frente mientras se prepara la selfie',
      change(front),
    )
    await pickTap(page, 'el marco del frente al cambiar la foto', chooser, newFront, [
      { selector: waitIn(FRONT) },
    ])
    await expect(frontPreview).toBeVisible({ timeout: PHOTO_READY_MS })
    await expect(selfiePreview).toBeVisible({ timeout: PHOTO_READY_MS })
    const whileChanging = 'un toque cualquiera mientras se cambian el frente y la selfie'
    expectAnswered(whileChanging, await longestTask(whileChanging))
    expectProcessed(
      'la vista previa del frente',
      await previewBytes(page, 'El frente de tu cédula, antes de enviarlo'),
    )
    expectProcessed(
      'la vista previa de la selfie',
      await previewBytes(page, 'Tu selfie con la cédula, antes de enviarla'),
    )

    actions.reset()
    const submit = page.getByRole('button', { name: 'Enviar mi pedido' })
    await expect(submit).toBeEnabled()
    const sent = await timeTap(
      page,
      '«Enviar mi pedido» tocado dos veces',
      () => submit.dblclick(),
      [{ selector: 'button[aria-busy="true"]', text: 'Enviar mi pedido' }],
    )
    expectAnswered('«Enviar mi pedido» tocado dos veces', sent)
    await expect(page.getByRole('heading', { name: 'Tu pedido está en revisión' })).toBeVisible({
      timeout: 60_000,
    })
    expect(actions.count(), '«Enviar mi pedido» tocado dos veces, pedidos que salieron').toBe(1)
    const images = await sentImages(person)
    expect(images, 'las dos fotos del pedido').toHaveLength(2)
    for (const image of images) expectProcessed('una foto del pedido', image)
  } finally {
    await removePerson(person)
  }
})

test('una foto que no se puede preparar avisa en menos de 200 ms y «Elegir foto» vuelve a contestar', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const person = await newPerson('Dani Prueba', { level: 1 })
  // Dice ser un JPEG y no lo es: pasa la revisión del tipo y falla al prepararla.
  const broken = onDisk(
    'rota.jpg',
    Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(64 * 1024, 7)]),
  )
  const tooBig = onDisk(
    'grande.jpg',
    Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(MAX_PHOTO_BYTES + 1)]),
  )
  try {
    await signIn(page, person.email, IDENTITY)
    await expect(page.getByRole('button', { name: 'Acepto y elijo las fotos' })).toBeVisible({
      timeout: 30_000,
    })
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await settled(page, `${origin}${IDENTITY}`)
    await page.getByRole('button', { name: 'Acepto y elijo las fotos' }).click()
    const choose = page.locator(FRONT).getByRole('button', { name: 'Elegir foto' })

    let chooser = await chooseTap(page, '«Elegir foto» del frente', choose)
    // La espera puede durar menos de un cuadro: contesta lo primero que se vea, ella o el aviso.
    await pickTap(page, 'el marco del frente con un archivo que no es una foto', chooser, broken, [
      { selector: `${waitIn(FRONT)}, ${noticeIn(FRONT)}` },
    ])
    await expect(page.locator(noticeIn(FRONT))).toHaveText(
      'No pudimos usar esa foto. Probá con otra.',
    )

    chooser = await chooseTap(page, '«Elegir foto» después de una foto que no sirvió', choose)
    // Pasarse de los 10 MB se sabe sin prepararla: el aviso es la respuesta, como hoy.
    await pickTap(page, 'el aviso de una foto de más de 10 MB', chooser, tooBig, [
      { selector: noticeIn(FRONT), text: 'Esa foto pesa más de 10 MB' },
    ])
    await chooseTap(page, '«Elegir foto» después de una foto que pesaba demasiado', choose)
  } finally {
    await removePerson(person)
  }
})
