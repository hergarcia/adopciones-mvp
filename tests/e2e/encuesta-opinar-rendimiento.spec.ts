import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import { acceptApplication, sendApplication } from './support/applications'
import { cutLayer } from './support/cut-layer'
import { firstSeen } from './support/first-seen'
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
import { expectAnswered, timeTap, type Answer } from './support/tap-latency'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// Historia #352: la encuesta pendiente de «Mi solicitud» y de «Mis animales», y «Opinar», entran al
// presupuesto de docs/07 con red y procesador de teléfono de gama media; cada toque contesta en menos
// de 200 ms con el servidor tardando 3 s, y la encuesta que no llega deja «Reintentar» en su lugar.
// Los totales de las dos pantallas con la encuesta son los de `main` antes de #352, redondeados hacia
// arriba al décimo de KB: impiden esconder peso de apertura corriéndolo a después de abrir. «Opinar»
// baja todo al abrir y entra nueva al presupuesto: su tope es el de hoy, con el enlace de la cabecera
// que contesta al toque (docs/07, historia #352).
const MY_APPLICATION_TOTAL_KB = 172.9
const MY_PETS_TOTAL_KB = 211.9
const FEEDBACK_TOTAL_KB = 142
const FEEDBACK_SIGNED_IN_TOTAL_KB = 142

const NOT_CHOSEN = '¿Vas a seguir buscando por acá?'
// En la pared, la encuesta se nombra con el desenlace y no con la pregunta.
const GAVE = 'Le encontraste hogar a Tobi'
const REJECTED = 'eligió no seguir con tu solicitud.'
const SUGGESTIONS = 'Otros perros que buscan hogar'
const OPEN_QUESTION = '¿Algo más que quieras contarnos?'
const NOT_ARRIVED = 'La encuesta no llegó. Revisá la señal y probá de nuevo.'
const UNSENT =
  'No se pudo enviar por la conexión. Lo que elegiste y escribiste sigue acá: tocá «Enviar» de nuevo.'
const FEEDBACK_LEAD = 'Llega sin tu nombre y la lee el equipo.'
const FEEDBACK_LABEL = 'Tu opinión'
// Una clase que solo está en el código de la encuesta: el nombre de sus opciones.
const SURVEY_PART = 'encuesta-'
const MOTIONS = ['no-preference', 'reduce'] as const
const SLOW_MS = 3_000
const OPENING: Answer[] = [{ selector: 'a:has(> [data-opening])' }]

type Rejected = { ownerId: string; bruno: Person; id: string }
type Gave = { carla: { id: string; email: string }; ana: Person }

// Donde vive Bruno (`newPerson`), para que los perros de la corrida sean sus sugeridos.
const ROCHA = { department: 'UY-RO', locality: 'La Paloma', isNeutered: true }

// Bruno pidió a Luna y quien la publicó eligió no seguir: «Mi solicitud» le ofrece la encuesta. Dos
// perros más del mismo departamento son los sugeridos de abajo.
async function brunoRejected(): Promise<Rejected> {
  const { owner, pets } = await publishForRun(
    [
      { name: 'Luna', species: 'dog', ...ROCHA },
      { name: 'Tobi', species: 'dog', sex: 'male', ...ROCHA },
      { name: 'Nina', species: 'dog', ...ROCHA },
    ],
    { photo: { grain: true } },
  )
  const bruno = await newPerson('Bruno Prueba', { level: 1 })
  const id = await sendApplication(bruno.id, pets[0]?.code ?? '')
  const { data, error } = await service().rpc('reject_application', {
    p_publisher: owner.id,
    p_id: id,
    p_reason: 'chose_other',
  })
  expect(error).toBeNull()
  expect(data?.[0]).toMatchObject({ outcome: 'rejected' })
  return { ownerId: owner.id, bruno, id }
}

// Carla marcó adoptado a Tobi y se lo dio a Ana, con Luna y Nina todavía en su pared.
async function carlaGaveTobi(): Promise<Gave> {
  const { owner, pets } = await publishForRun(
    [
      { name: 'Luna', species: 'dog', isNeutered: true },
      { name: 'Nina', species: 'cat', isNeutered: true },
      { name: 'Tobi', species: 'dog', sex: 'male', isNeutered: true },
    ],
    { photo: { grain: true } },
  )
  const db = service()
  const { data: tobi } = await db
    .from('pets')
    .select('id')
    .eq('code', pets[2]?.code ?? '')
    .single()
  const ana = await newPerson('Ana Prueba', { level: 1 })
  const id = await sendApplication(ana.id, pets[2]?.code ?? '')
  await acceptApplication(owner.id, id)
  const marked = await db.rpc('mark_pet_adopted', {
    p_owner: owner.id,
    p_pet: String(tobi?.id ?? ''),
    p_attempt: crypto.randomUUID(),
    p_application: id,
  })
  expect(marked.error).toBeNull()
  expect(marked.data?.[0]).toMatchObject({ outcome: 'done' })
  return { carla: owner, ana }
}

async function removeGave(gave: Gave): Promise<void> {
  await removePerson(gave.ana)
  await removeRunOwner(gave.carla.id)
}

const myApplication = (id: string) => `/mis-solicitudes/${id}`
const surveyOf = (page: Page, question: string) => page.getByRole('region', { name: question })

async function offers(personId: string): Promise<{ state: string }[]> {
  const { data } = await service().from('survey_offers').select('state').eq('person_id', personId)
  return (data ?? []).map((row) => ({ state: String(row.state) }))
}

// Escribe como el teclado del teléfono: cada letra con su `keydown`, que es donde arranca el reloj.
async function typeLetter(page: Page, letter: string): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: letter, text: letter })
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: letter })
  await cdp.detach()
}

async function typeTimed(page: Page, field: Locator, words: string, where: string) {
  await field.focus()
  let typed = ''
  for (const letter of words) {
    typed += letter
    const name = `La «${letter}» de «${words}» en ${where}`
    // oxlint-disable-next-line no-await-in-loop -- letra por letra, como se escribe
    const ms = await timeTap(page, name, () => typeLetter(page, letter), [
      { selector: 'textarea', value: typed },
    ])
    expectAnswered(name, ms)
  }
}

// Sin respuesta del servidor: cada acción se corta.
async function lostActions(page: Page): Promise<() => Promise<void>> {
  const lost = async (route: Route) => {
    const request = route.request()
    if (request.method() === 'POST' && request.headers()['next-action'] !== undefined) {
      await route.abort()
      return
    }
    await route.fallback()
  }
  await page.route('**/*', lost)
  return () => page.unroute('**/*', lost)
}

// El sitio tarda 3 s en contestar cada pantalla pedida desde adentro; cuenta las veces que se pidió
// «Opinar».
async function slowSite(page: Page): Promise<{ feedback: () => number }> {
  let feedback = 0
  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const headers = request.headers()
    const isInSite = headers.rsc !== undefined && headers['next-router-prefetch'] === undefined
    if (request.method() === 'GET' && isInSite) {
      if (new URL(request.url()).pathname === '/opinar') feedback += 1
      await new Promise((resolve) => setTimeout(resolve, SLOW_MS))
    }
    await route.fallback()
  })
  return { feedback: () => feedback }
}

// Covers: criterios 1 y 5 de #352
test('«Mi solicitud» y «Mis animales» con la encuesta pendiente abren dentro de los 150 KB sin correr lo de abajo', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let rejected: Rejected | null = null
  let gave: Gave | null = null
  try {
    rejected = await brunoRejected()
    gave = await carlaGaveTobi()

    await signIn(page, rejected.bruno.email, myApplication(rejected.id))
    await expect(surveyOf(page, NOT_CHOSEN)).toBeVisible()
    const applicationUrl = new URL(myApplication(rejected.id), page.url()).href
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const application = await measure(page, applicationUrl)
    await expect(surveyOf(page, NOT_CHOSEN)).toBeVisible({ timeout: 15_000 })
    const applicationSettled = await vitalsOf(page)
    const seen = await firstSeen(page, applicationUrl, [REJECTED, SUGGESTIONS])
    test.info().annotations.push({
      type: 'rendimiento',
      description: `desenlace y sugeridos en «Mi solicitud»: ${seen.map(Math.round).join(', ')} ms`,
    })

    await page.context().clearCookies()
    await signIn(page, gave.carla.email, '/mis-animales')
    await expect(surveyOf(page, GAVE)).toBeVisible()
    const petsUrl = new URL('/mis-animales', page.url()).href
    const pets = await measure(page, petsUrl)
    await expect(surveyOf(page, GAVE)).toBeVisible({ timeout: 15_000 })
    const petsSettled = await vitalsOf(page)

    const screen = '«Mi solicitud» de Bruno con la encuesta pendiente'
    expectVitals(screen, application)
    expect(applicationSettled.cls, `CLS de ${screen} con la encuesta en pantalla`).toBeLessThan(CLS)
    expectOpenWithin(screen, application)
    expectTotalWithin(screen, application, MY_APPLICATION_TOTAL_KB)
    expect(seen[0], `El desenlace en ${screen}, en ms`).toBeLessThan(LCP_MS)

    const wall = '«Mis animales» de Carla con la encuesta junto a Tobi'
    expectVitals(wall, pets)
    expect(petsSettled.cls, `CLS de ${wall} con la encuesta en pantalla`).toBeLessThan(CLS)
    expectOpenWithin(wall, pets)
    expectTotalWithin(wall, pets, MY_PETS_TOTAL_KB)
  } finally {
    if (rejected !== null) {
      await removePerson(rejected.bruno)
      await removeRunOwner(rejected.ownerId)
    }
    if (gave !== null) await removeGave(gave)
  }
})

// La espera tiene el alto de la encuesta en los dos anchos: lo de abajo queda donde estaba. Con la
// ventana baja, la pantalla es más alta que ella y el pie no queda fijo al fondo.
async function expectHeldPlace(page: Page, url: string, question: string, below: Locator) {
  const part = await cutLayer(page, SURVEY_PART)
  for (const width of [390, 1280]) {
    part.set('hold')
    // oxlint-disable-next-line no-await-in-loop -- un ancho por vez
    await page.setViewportSize({ width, height: 640 })
    // oxlint-disable-next-line no-await-in-loop
    await page.goto(url, { waitUntil: 'load' })
    // oxlint-disable-next-line no-await-in-loop
    await page.waitForTimeout(1_500)
    // oxlint-disable-next-line no-await-in-loop
    await expect(below).toBeVisible()
    // oxlint-disable-next-line no-await-in-loop
    const waiting = await below.boundingBox()
    // oxlint-disable-next-line no-await-in-loop
    await part.release()
    // oxlint-disable-next-line no-await-in-loop
    await expect(surveyOf(page, question)).toBeVisible({ timeout: 15_000 })
    // oxlint-disable-next-line no-await-in-loop
    const arrived = await below.boundingBox()
    expect(
      Math.abs((arrived?.y ?? 0) - (waiting?.y ?? Number.NaN)),
      `${question} a ${width} px: cuánto se corrió lo de abajo al llegar, en px`,
    ).toBeLessThanOrEqual(1)
  }
}

// Covers: criterio 1 de #352
test('la espera de la encuesta guarda su lugar a 390 y a 1280 px en las dos pantallas', async ({
  page,
}) => {
  test.setTimeout(240_000)
  let rejected: Rejected | null = null
  let gave: Gave | null = null
  try {
    rejected = await brunoRejected()
    gave = await carlaGaveTobi()
    await signIn(page, rejected.bruno.email, myApplication(rejected.id))
    await expectHeldPlace(
      page,
      new URL(myApplication(rejected.id), page.url()).href,
      NOT_CHOSEN,
      page.getByRole('heading', { name: SUGGESTIONS }),
    )
    await page.context().clearCookies()
    await signIn(page, gave.carla.email, '/mis-animales')
    await expectHeldPlace(
      page,
      new URL('/mis-animales', page.url()).href,
      GAVE,
      page.getByRole('contentinfo'),
    )
  } finally {
    if (rejected !== null) {
      await removePerson(rejected.bruno)
      await removeRunOwner(rejected.ownerId)
    }
    if (gave !== null) await removeGave(gave)
  }
})

// Covers: criterios 2 y 5 de #352
test('elegir, escribir, «Enviar» y «Ahora no» de la encuesta contestan en menos de 200 ms y guardan una sola vez', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let rejected: Rejected | null = null
  let gave: Gave | null = null
  try {
    rejected = await brunoRejected()
    gave = await carlaGaveTobi()
    const words = `Fue rápido ${crypto.randomUUID().slice(0, 4).replace(/\d/g, 'x')}`
    await signIn(page, rejected.bruno.email, myApplication(rejected.id))
    const url = new URL(myApplication(rejected.id), page.url()).href
    await throttleLikeAPhone(page)
    await settled(page, url)
    const survey = surveyOf(page, NOT_CHOSEN)
    await expect(survey).toBeVisible({ timeout: 15_000 })
    const yes = survey.getByRole('radio', { name: 'Sí', exact: true })
    const text = survey.getByRole('textbox', { name: OPEN_QUESTION })
    const send = survey.getByRole('button', { name: 'Enviar', exact: true })

    const choosing = 'Elegir «Sí» en la encuesta de «Mi solicitud»'
    expectAnswered(
      choosing,
      await timeTap(page, choosing, () => yes.click(), [
        { selector: 'input[type="radio"][value="yes"]', checked: true },
      ]),
    )
    await typeTimed(page, text, words, 'la encuesta de «Mi solicitud»')

    // Sin respuesta: el aviso de siempre, con lo elegido y lo escrito en pantalla.
    const found = await lostActions(page)
    await send.click()
    await expect(survey.getByText(UNSENT)).toBeVisible({ timeout: 15_000 })
    await expect(yes).toBeChecked()
    await expect(text).toHaveValue(words)
    await found()

    const actions = await slowActions(page)
    const sending = '«Enviar» de la encuesta tocado dos veces con la respuesta a 3 s'
    expectAnswered(
      sending,
      await timeTap(page, sending, () => send.dblclick(), [
        { selector: 'button[aria-busy="true"]', text: 'Enviar' },
      ]),
    )
    await expect(page.getByText('Gracias por contarnos.')).toBeVisible({ timeout: 30_000 })
    expect(actions.count(), `${sending}, acciones que salieron`).toBe(1)
    const { count } = await service()
      .from('survey_answers')
      .select('id', { count: 'exact', head: true })
      .eq('body', words)
    expect(count, `${sending}, respuestas guardadas`).toBe(1)
    expect(await offers(rejected.bruno.id)).toEqual([{ state: 'answered' }])

    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await page.context().clearCookies()
    await signIn(page, gave.carla.email, '/mis-animales')
    const wallActions = await slowActions(page)
    await settled(page, new URL('/mis-animales', page.url()).href)
    const gaveSurvey = surveyOf(page, GAVE)
    await expect(gaveSurvey).toBeVisible({ timeout: 15_000 })
    const later =
      '«Ahora no» de la encuesta de «Mis animales» tocado dos veces con la respuesta a 3 s'
    expectAnswered(
      later,
      await timeTap(
        page,
        later,
        () => gaveSurvey.getByRole('button', { name: 'Ahora no', exact: true }).dblclick(),
        [{ selector: 'button[aria-busy="true"]', text: 'Ahora no' }],
      ),
    )
    await expect(gaveSurvey).toHaveCount(0, { timeout: 30_000 })
    expect(wallActions.count(), `${later}, acciones que salieron`).toBe(1)
    expect(await offers(gave.carla.id)).toEqual([{ state: 'dismissed' }])
  } finally {
    if (rejected !== null) {
      await removePerson(rejected.bruno)
      await removeRunOwner(rejected.ownerId)
    }
    if (gave !== null) await removeGave(gave)
  }
})

// Covers: criterio 3 de #352
test('la encuesta que no llega en 10 s deja «Reintentar» en su lugar y sigue pendiente', async ({
  page,
}) => {
  test.setTimeout(180_000)
  let rejected: Rejected | null = null
  try {
    rejected = await brunoRejected()
    await signIn(page, rejected.bruno.email, myApplication(rejected.id))
    await expect(surveyOf(page, NOT_CHOSEN)).toBeVisible()
    const url = new URL(myApplication(rejected.id), page.url()).href
    const part = await cutLayer(page, SURVEY_PART)
    const notice = page.getByRole('alert').filter({ hasText: NOT_ARRIVED })

    // Se va sin reintentar: la próxima vez que abre, la encuesta está de nuevo, ofrecida una vez.
    part.set('hold')
    await page.goto(url, { waitUntil: 'load' })
    const openedAt = Date.now()
    await expect(notice).toBeVisible({ timeout: 15_000 })
    expect(Date.now() - openedAt, 'el aviso, en ms desde que abrió').toBeGreaterThan(8_000)
    await expect(page.getByRole('heading', { level: 1, name: 'Luna' })).toBeVisible()
    await expect(page.getByText(REJECTED)).toBeVisible()
    await expect(page.getByRole('heading', { name: SUGGESTIONS })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toHaveCount(1)
    await part.release()
    await page.goto(url, { waitUntil: 'load' })
    await expect(surveyOf(page, NOT_CHOSEN)).toBeVisible({ timeout: 15_000 })
    expect(await offers(rejected.bruno.id)).toEqual([{ state: 'pending' }])

    // Con «Reintentar», la trae sin recargar la pantalla.
    part.set('hold')
    await page.goto(url, { waitUntil: 'load' })
    await page.evaluate(() => Reflect.set(window, '__sinRecargar', true))
    await expect(notice).toBeVisible({ timeout: 15_000 })
    await part.release()
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
    await expect(surveyOf(page, NOT_CHOSEN)).toBeVisible({ timeout: 15_000 })
    expect(await page.evaluate(() => Reflect.get(window, '__sinRecargar'))).toBe(true)
    await expect(notice).toHaveCount(0)
    expect(await offers(rejected.bruno.id)).toEqual([{ state: 'pending' }])
  } finally {
    if (rejected !== null) {
      await removePerson(rejected.bruno)
      await removeRunOwner(rejected.ownerId)
    }
  }
})

// Covers: criterios 4 y 5 de #352
test('«Opinar» abre dentro de los 150 KB con y sin sesión', async ({ page }) => {
  test.setTimeout(180_000)
  const ana = await newPerson('Ana Prueba', { level: 1 })
  try {
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const screens: { screen: string; total: number }[] = [
      { screen: '«Opinar» sin sesión', total: FEEDBACK_TOTAL_KB },
      { screen: '«Opinar» con sesión', total: FEEDBACK_SIGNED_IN_TOTAL_KB },
    ]
    for (const [index, { screen, total }] of screens.entries()) {
      // oxlint-disable-next-line no-await-in-loop -- con sesión después de entrar
      if (index === 1) await signIn(page, ana.email, '/opinar')
      const url = index === 0 ? '/opinar' : new URL('/opinar', page.url()).href
      // oxlint-disable-next-line no-await-in-loop
      const measured = await measure(page, url)
      // oxlint-disable-next-line no-await-in-loop
      const seen = await firstSeen(page, url, [FEEDBACK_LEAD, FEEDBACK_LABEL])
      test.info().annotations.push({
        type: 'rendimiento',
        description: `${screen}, título y campo: ${seen.map(Math.round).join(', ')} ms`,
      })
      expectVitals(screen, measured)
      expectOpenWithin(screen, measured)
      expectTotalWithin(screen, measured, total)
      expect(seen[0], `El título de ${screen}, en ms`).toBeLessThan(LCP_MS)
      expect(seen[1], `El campo de ${screen}, en ms`).toBeLessThan(LCP_MS)
    }
  } finally {
    await removePerson(ana)
  }
})

async function writeAndSend(page: Page, where: string, run: string) {
  const box = page.getByRole('textbox', { name: FEEDBACK_LABEL })
  await expect(box).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  const words = `Me gusta ${run}`
  await typeTimed(page, box, words, where)
  const actions = await slowActions(page)
  const sending = `«Enviar» de ${where} tocado dos veces con la respuesta a 3 s`
  expectAnswered(
    sending,
    await timeTap(page, sending, () => page.getByRole('button', { name: 'Enviar' }).dblclick(), [
      { selector: 'button[aria-busy="true"]', text: 'Enviar' },
    ]),
  )
  await expect(page.getByText('Tu opinión llegó. Gracias.')).toBeVisible({ timeout: 30_000 })
  expect(actions.count(), `${sending}, acciones que salieron`).toBe(1)
  const { count } = await service()
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('body', words)
  expect(count, `${sending}, opiniones guardadas`).toBe(1)
}

for (const motion of MOTIONS) {
  // Covers: criterios 4 y 5 de #352
  test(`tocar «Opinar», escribir y «Enviar» contestan en menos de 200 ms con y sin sesión (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    // Con letras: una tira de cifras parece un teléfono y la opinión se rechaza.
    const run = crypto
      .randomUUID()
      .slice(0, 8)
      .replace(/\d/g, (digit) => 'ghijklmnop'.charAt(Number(digit)))
    const ana = await newPerson('Ana Prueba', { level: 1 })
    try {
      await page.emulateMedia({ reducedMotion: motion })
      await throttleLikeAPhone(page)
      await settled(page, '/animales')
      const site = await slowSite(page)
      const header = page
        .getByRole('navigation')
        .first()
        .getByRole('link', { name: 'Opinar', exact: true })
      const fromHeader = `«Opinar» en la cabecera, sin sesión, tocado dos veces (${motion})`
      expectAnswered(fromHeader, await timeTap(page, fromHeader, () => header.dblclick(), OPENING))
      await expect(header).toHaveCSS('opacity', '0.6')
      await expect(page.getByRole('heading', { level: 1, name: 'Opinar' })).toBeVisible({
        timeout: 30_000,
      })
      expect(site.feedback(), `${fromHeader}, veces que se pidió «Opinar»`).toBe(1)
      await writeAndSend(page, `«Opinar» sin sesión (${motion})`, `${run}a`)

      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await signIn(page, ana.email, '/animales')
      await page.waitForLoadState('networkidle')
      const signedIn = await slowSite(page)
      await page.getByRole('button', { name: 'Mi cuenta' }).click()
      const menu = page.getByRole('navigation', { name: 'Mi cuenta' })
      const inMenu = menu.getByRole('link', { name: 'Opinar', exact: true })
      await expect(inMenu).toBeVisible()
      const fromMenu = `«Opinar» en el menú de la cuenta tocado dos veces (${motion})`
      expectAnswered(fromMenu, await timeTap(page, fromMenu, () => inMenu.dblclick(), OPENING))
      await expect(inMenu).toHaveCSS('opacity', '0.6')
      await expect(page.getByRole('heading', { level: 1, name: 'Opinar' })).toBeVisible({
        timeout: 30_000,
      })
      await expect(menu).toBeHidden()
      expect(signedIn.feedback(), `${fromMenu}, veces que se pidió «Opinar»`).toBe(1)
      await writeAndSend(page, `«Opinar» con sesión (${motion})`, `${run}b`)
    } finally {
      await removePerson(ana)
    }
  })
}
