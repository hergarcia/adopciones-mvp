import { expect, test, type Page, type Route } from '@playwright/test'
import { acceptApplication, sendApplication } from './support/applications'
import { makePhotos, pick } from './support/big-photos'
import { photoWithGps } from './support/exif-fixture'
import { firstSeen } from './support/first-seen'
import { adoptedMonthAgo } from './support/follow-ups'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import {
  CLS,
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  LCP_MS,
  measure,
} from './support/screen-budget'
import { settled, slowActions } from './support/slow-server'
import { expectAnswered, timeTap } from './support/tap-latency'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// Historia #342: «Mi solicitud» con el seguimiento pedido, el día 30, entra al presupuesto de
// docs/07 con red y procesador de teléfono de gama media, y cada toque del formulario contesta en
// menos de 200 ms, también mientras se preparan tres fotos de 12 megapíxeles. El total es el de
// `main` antes de #342, redondeado hacia arriba al décimo de KB: impide esconder peso de apertura
// corriéndolo a después de abrir.
const MY_FOLLOW_UP_TOTAL_KB = 173.6
const PHOTO_READY_MS = 5_000
const TITLE = '¿Cómo va Tobi?'
const HELP = 'quiere saber cómo está. Mandale de 1 a 3 fotos.'
const TEXT = 'Contale algo, si querés'
const SUBMIT = 'Contar cómo va'
const PHOTOS_REQUIRED = 'Hace falta al menos una foto.'
const NO_RESPONSE = 'El sitio no respondió. Tus fotos y tu texto siguen acá: probá de nuevo.'
const WRITTEN = 'Está enorme'

type Run = { ownerId: string; adopter: Person; id: string }

async function followUpAsked(): Promise<Run> {
  const { owner, pets } = await publishForRun([{ name: 'Tobi', species: 'dog', sex: 'male' }], {
    photo: { grain: true },
  })
  const adopter = await newPerson('Ana Prueba', { level: 1 })
  const { data } = await service()
    .from('pets')
    .select('id')
    .eq('code', pets[0]?.code ?? '')
    .single()
  const id = await sendApplication(adopter.id, pets[0]?.code ?? '')
  await acceptApplication(owner.id, id)
  await adoptedMonthAgo(owner.id, String(data?.id ?? ''), id)
  return { ownerId: owner.id, adopter, id }
}

async function cleanUp(run: Run | null): Promise<void> {
  if (run === null) return
  await removePerson(run.adopter)
  await removeRunOwner(run.ownerId)
}

async function openFollowUp(page: Page, run: Run): Promise<string> {
  await signIn(page, run.adopter.email, `/mis-solicitudes/${run.id}`)
  await expect(page.getByRole('heading', { name: TITLE })).toBeVisible()
  return `${new URL(page.url()).origin}/mis-solicitudes/${run.id}`
}

// Escribe como el teclado del teléfono, también la «á», que no está en el teclado que conoce
// Playwright: cada letra con su `keydown`, que es donde arranca el reloj del toque.
async function typeLetter(page: Page, letter: string): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: letter, text: letter })
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: letter })
  await cdp.detach()
}

// Cuándo quedó lista cada foto, en ms desde que se eligieron: una vista previa nueva es una foto que
// terminó de prepararse.
async function watchReady(page: Page): Promise<() => Promise<number[]>> {
  await page.evaluate(() => {
    const start = performance.now()
    const seen = new Set<string>()
    const times: number[] = []
    Reflect.set(window, '__readyAt', times)
    new MutationObserver(() => {
      for (const image of document.querySelectorAll('img')) {
        if (!/^Foto \d$/.test(image.alt)) continue
        const source = image.getAttribute('src') ?? ''
        if (source === '' || seen.has(source)) continue
        seen.add(source)
        times.push(performance.now() - start)
      }
    }).observe(document.body, { subtree: true, childList: true, attributes: true })
  })
  return () =>
    page.evaluate(() => {
      const times: unknown = Reflect.get(window, '__readyAt')
      return Array.isArray(times) ? times.map(Number) : []
    })
}

// Covers: criterios 1 y 5 de #342
test('«Mi solicitud» con el seguimiento pedido abre dentro de los 150 KB sin correr el compromiso', async ({
  page,
}) => {
  test.setTimeout(180_000)
  let run: Run | null = null
  try {
    run = await followUpAsked()
    const path = await openFollowUp(page, run)
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const measured = await measure(page, path)
    // El formulario llega después de abrir: el corrimiento se mira también con él en pantalla.
    await expect(page.getByRole('textbox', { name: TEXT })).toBeVisible({ timeout: 15_000 })
    const settledVitals = await vitalsOf(page)
    const seen = await firstSeen(page, path, [TITLE, HELP])
    test.info().annotations.push({
      type: 'rendimiento',
      description: `título y ayuda del seguimiento: ${seen.map(Math.round).join(', ')} ms`,
    })

    const screen = '«Mi solicitud» con el seguimiento pedido'
    expectVitals(screen, measured)
    expect(settledVitals.cls, `CLS de ${screen} con el formulario en pantalla`).toBeLessThan(CLS)
    expectOpenWithin(screen, measured)
    expectTotalWithin(screen, measured, MY_FOLLOW_UP_TOTAL_KB)
    expect(seen[0], `«${TITLE}» en ${screen}, en ms`).toBeLessThan(LCP_MS)
    expect(seen[1], `La ayuda de «${TITLE}» en ${screen}, en ms`).toBeLessThan(LCP_MS)
    await expect(
      page.getByRole('button', { name: 'Acepto el compromiso', exact: true }),
    ).toBeVisible()
  } finally {
    await cleanUp(run)
  }
})

// Covers: criterios 2 y 5 de #342. Se vuelve a escribir hasta que las tres están listas: así cada
// letra cae mientras se preparan, también en una máquina que las prepara más rápido que un teléfono.
// Para «Quitar foto» en la segunda con una en camino, la tercera se cambia por otra recién elegida.
test('mientras se preparan tres fotos, escribir «Está enorme» y «Quitar foto» contestan en menos de 200 ms', async ({
  page,
}) => {
  test.setTimeout(180_000)
  let run: Run | null = null
  try {
    run = await followUpAsked()
    await openFollowUp(page, run)
    await page.waitForLoadState('networkidle')
    await makePhotos(page, 3)
    await throttleLikeAPhone(page)
    const photos = page.getByRole('img', { name: /^Foto \d$/ })
    const text = page.getByRole('textbox', { name: TEXT })
    const remove = page.getByRole('button', { name: 'Quitar foto', exact: true })
    const count = page.locator('output')

    const readyAt = await watchReady(page)
    const photosStart = Date.now()
    await pick(page, 0, 3)
    expect(await photos.count(), 'fotos listas al empezar a escribir').toBeLessThan(3)
    await text.focus()
    do {
      // oxlint-disable-next-line no-await-in-loop -- una vuelta del texto por vez
      await text.fill('')
      let typed = ''
      for (const letter of WRITTEN) {
        typed += letter
        const name = `La «${letter}» de «${WRITTEN}» con fotos preparándose`
        // oxlint-disable-next-line no-await-in-loop -- letra por letra, como se escribe
        const ms = await timeTap(page, name, () => typeLetter(page, letter), [
          { selector: 'textarea', value: typed },
        ])
        expectAnswered(name, ms)
      }
      // oxlint-disable-next-line no-await-in-loop
    } while ((await photos.count()) < 3 && Date.now() - photosStart < 3 * PHOTO_READY_MS)

    await expect(photos).toHaveCount(3, { timeout: 3 * PHOTO_READY_MS })
    await expect(text).toHaveValue(WRITTEN)
    const times = await readyAt()
    expect(times, 'fotos que terminaron de prepararse').toHaveLength(3)
    times.forEach((time, index) => {
      const took = time - (times[index - 1] ?? 0)
      expect(took, `la foto ${index + 1} de 12 MP lista, en ms`).toBeLessThan(PHOTO_READY_MS)
    })

    await remove.nth(2).click()
    await expect(count).toHaveText('2 de 3 fotos')
    const changedAt = Date.now()
    await pick(page, 0, 1)
    await expect(count).toHaveText('3 de 3 fotos')
    const removing = '«Quitar foto» en la segunda con la tercera preparándose'
    const ms = await timeTap(page, removing, () => remove.nth(1).click(), [
      { selector: 'output', text: '2 de 3 fotos' },
    ])
    expect(await photos.count(), 'fotos listas al quitar la segunda').toBe(1)
    expectAnswered(removing, ms)
    await expect(photos).toHaveCount(2, { timeout: PHOTO_READY_MS })
    expect(Date.now() - changedAt, 'la foto nueva de 12 MP lista, en ms').toBeLessThan(
      PHOTO_READY_MS,
    )
  } finally {
    await cleanUp(run)
  }
})

// Covers: criterio 3 de #342 (KL-69-1)
test('el aviso de que falta una foto se va con la primera y no vuelve al quitarla', async ({
  page,
}) => {
  test.setTimeout(180_000)
  let run: Run | null = null
  try {
    run = await followUpAsked()
    await openFollowUp(page, run)
    await page.waitForLoadState('networkidle')
    await makePhotos(page, 1)
    await throttleLikeAPhone(page)
    const notice = page.getByText(PHOTOS_REQUIRED, { exact: true })
    const photos = page.getByRole('img', { name: /^Foto \d$/ })
    const submit = page.getByRole('button', { name: SUBMIT, exact: true })

    await submit.click()
    await expect(notice).toBeVisible()
    await pick(page, 0, 1)
    await expect(notice).toHaveCount(0)
    expect(await photos.count(), 'la foto todavía se prepara cuando el aviso se fue').toBe(0)

    await expect(photos).toHaveCount(1, { timeout: PHOTO_READY_MS * 2 })
    await page.getByRole('button', { name: 'Quitar foto', exact: true }).click()
    await expect(page.getByText('Agregá fotos', { exact: true })).toBeVisible()
    await expect(notice).toHaveCount(0)

    await submit.click()
    await expect(notice).toBeVisible()
  } finally {
    await cleanUp(run)
  }
})

// Covers: criterios 4 y 5 de #342
test('«Contar cómo va» tocado dos veces con mala señal trabaja al toque, manda una vez y avisa si no llega', async ({
  page,
}) => {
  test.setTimeout(180_000)
  let run: Run | null = null
  try {
    run = await followUpAsked()
    const path = await openFollowUp(page, run)
    const files = await Promise.all(
      [
        [600, 750],
        [750, 600],
      ].map(async ([width, height], index) => ({
        name: `tobi_${index}.jpg`,
        mimeType: 'image/jpeg',
        buffer: await photoWithGps(page, width, height),
      })),
    )
    await throttleLikeAPhone(page)
    await settled(page, path)
    const photos = page.getByRole('img', { name: /^Foto \d$/ })
    const text = page.getByRole('textbox', { name: TEXT })
    const submit = page.getByRole('button', { name: SUBMIT, exact: true })
    await page.locator('input[type=file]').setInputFiles(files)
    await expect(photos).toHaveCount(2, { timeout: 2 * PHOTO_READY_MS })
    await text.fill(WRITTEN)

    // Sin respuesta: el aviso de siempre, con las fotos y el texto en pantalla.
    const lost = async (route: Route) => {
      const request = route.request()
      if (request.method() === 'POST' && request.headers()['next-action'] !== undefined) {
        await route.abort()
        return
      }
      await route.fallback()
    }
    await page.route('**/*', lost)
    await submit.click()
    await expect(page.getByText(NO_RESPONSE)).toBeVisible({ timeout: 15_000 })
    await expect(photos).toHaveCount(2)
    await expect(text).toHaveValue(WRITTEN)
    await page.unroute('**/*', lost)

    const actions = await slowActions(page)
    const name = '«Contar cómo va» tocado dos veces con la respuesta a 3 s'
    const ms = await timeTap(page, name, () => submit.dblclick(), [
      { selector: 'button[aria-busy="true"]', text: SUBMIT },
    ])
    expectAnswered(name, ms)
    await expect(page).toHaveURL(new RegExp(`/mis-solicitudes/${run.id}\\?contado=1$`), {
      timeout: 60_000,
    })
    // Dos fotos y la respuesta: una sola vez cada una.
    expect(actions.count(), `${name}, acciones que salieron`).toBe(3)
    await expect(page.getByText('Adopción con seguimiento', { exact: true })).toBeVisible()
  } finally {
    await cleanUp(run)
  }
})
