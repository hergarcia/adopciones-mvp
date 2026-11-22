import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import { acceptApplication, sendApplication } from './support/applications'
import { cutLayer, OVERLAY_LAYER, partFailedNotice } from './support/cut-layer'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import {
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  LCP_MS,
  measure,
  type Measured,
} from './support/screen-budget'
import { settled, slowActions, type SlowActions } from './support/slow-server'
import { expectAnswered, timeTap, type Answer } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #334: el final del camino de quien publica, «¿A quién se lo diste?» y «Tu camada», entra
// al presupuesto de las pantallas con sesión (docs/07 §Presupuesto de performance), con red y
// procesador de teléfono de gama media. Los totales de `main` antes de #334, redondeados hacia arriba
// al décimo de KB, impiden esconder peso de apertura corriéndolo a después de abrir.
const HANDOVER_TOTAL_KB = 146.3
const YOUNG_HANDOVER_TOTAL_KB = 147.7
const OUTSIDE_ONLY_TOTAL_KB = 146.3
const LITTER_PANEL_TOTAL_KB = 186.3
const MOTIONS = ['no-preference', 'reduce'] as const
const LITTER = 'La camada de Luna'
const STATS = `Cómo le va a «${LITTER}»`
const OUTSIDE = 'Se la di a alguien que no vino por el sitio'
const FOUND_VIA = '¿Por dónde te encontró?'
const CONFIRM_ANA = 'Acepto el compromiso y marco adoptada a Ana Prueba'

test.use({ viewport: { width: 390, height: 844 } })

type Closing = {
  owner: { id: string; email: string }
  ana: Person
  beto: Person
  luna: string
  mora: string
  litter: string
  /** Las crías por nombre: «Cría 1» → id. */
  young: Map<string, string>
}

async function petId(code: string): Promise<string> {
  const { data } = await service().from('pets').select('id').eq('code', code).single()
  return String(data?.id ?? '')
}

async function codeOf(id: string): Promise<string> {
  const { data } = await service().from('pets').select('code').eq('id', id).single()
  return String(data?.code ?? '')
}

async function adoptionsOf(id: string): Promise<number> {
  const { count } = await service()
    .from('adoptions')
    .select('id', { count: 'exact', head: true })
    .eq('pet_id', id)
  return count ?? 0
}

async function markInProcess(ownerId: string, id: string): Promise<void> {
  const { error } = await service().rpc('change_young_status', {
    p_owner: ownerId,
    p_pet: id,
    p_action: 'mark_in_process',
  })
  expect(error).toBeNull()
}

async function adoptedBy(ownerId: string, adopter: Person, id: string): Promise<void> {
  const application = await sendApplication(adopter.id, await codeOf(id), {
    neuter_commitment: 'yes',
  })
  await acceptApplication(ownerId, application)
  const { error } = await service().rpc('mark_pet_adopted', {
    p_owner: ownerId,
    p_pet: id,
    p_attempt: crypto.randomUUID(),
    p_application: application,
  })
  expect(error).toBeNull()
}

async function accepted(ownerId: string, adopters: Person[], code: string, young = false) {
  for (const adopter of adopters) {
    // oxlint-disable-next-line no-await-in-loop -- una solicitud por vez, como las manda el sitio
    const id = await sendApplication(adopter.id, code, young ? { neuter_commitment: 'yes' } : {})
    // oxlint-disable-next-line no-await-in-loop
    await acceptApplication(ownerId, id)
  }
}

// La versión más pesada de cada pantalla (decisión de #334): Luna con dos aceptadas, Mora sin
// ninguna, y una camada de 10 crías —el máximo— con dos en proceso, una adoptada, una con una
// solicitud nueva y una con dos aceptadas, todas con foto.
async function closingRescuer(youngCount = 10): Promise<Closing> {
  const { owner, pets } = await publishForRun(
    [
      { name: 'Luna', species: 'dog', isNeutered: true },
      { name: 'Mora', species: 'cat', isNeutered: true },
    ],
    { photo: { grain: true } },
  )
  const litter = await publishLitterForRun(owner.id, youngCount, { photo: { grain: true } })
  const ana = await newPerson('Ana Prueba', { level: 1 })
  const beto = await newPerson('Beto Prueba', { level: 1 })
  const { data } = await service().from('pets').select('id, name').eq('litter_id', litter.id)
  const young = new Map((data ?? []).map((one) => [String(one.name), String(one.id)]))
  const id = (name: string) => young.get(name) ?? ''
  await accepted(owner.id, [ana, beto], pets[0]?.code ?? '')
  await adoptedBy(owner.id, ana, id('Cría 3'))
  if (youngCount >= 10) {
    await markInProcess(owner.id, id('Cría 1'))
    await markInProcess(owner.id, id('Cría 2'))
    await sendApplication(beto.id, await codeOf(id('Cría 4')), { neuter_commitment: 'yes' })
    await accepted(owner.id, [ana, beto], await codeOf(id('Cría 5')), true)
  }
  return {
    owner,
    ana,
    beto,
    luna: await petId(pets[0]?.code ?? ''),
    mora: await petId(pets[1]?.code ?? ''),
    litter: litter.id,
    young,
  }
}

async function cleanUp(closing: Closing | null): Promise<void> {
  if (closing === null) return
  await removePerson(closing.ana)
  await removePerson(closing.beto)
  await removeRunOwner(closing.owner.id)
}

const panelPath = (litter: string) => `/mis-animales/camadas/${litter}`
const handoverPath = (id: string, back?: string) =>
  `/mis-animales/${id}/adoptado${back === undefined ? '' : `?volver=${encodeURIComponent(back)}`}`

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

// En qué cuadro se vio por primera vez cada texto y la foto más grande de la pantalla, en ms desde
// que empezó a abrir: lo principal tiene que estar a la vista antes de los 2,5 s, y no llegar después.
async function firstSeen(page: Page, path: string, texts: string[]): Promise<number[]> {
  await page.addInitScript((wanted) => {
    const seen: number[] = [...wanted, 'foto'].map(() => Number.POSITIVE_INFINITY)
    Reflect.set(window, '__firstSeen', seen)
    const visible = (text: string) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement
        if (node.textContent?.includes(text) === true && parent?.checkVisibility() === true) {
          return true
        }
      }
      return false
    }
    const photoShown = () =>
      Array.from(document.querySelectorAll('main img')).some(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0 &&
          image.getBoundingClientRect().width >= 100 &&
          image.checkVisibility(),
      )
    const frame = (now: number) => {
      if (document.body !== null) {
        wanted.forEach((text, index) => {
          if (seen[index] === Number.POSITIVE_INFINITY && visible(text)) seen[index] = now
        })
        if (seen[wanted.length] === Number.POSITIVE_INFINITY && photoShown()) {
          seen[wanted.length] = now
        }
      }
      if (seen.includes(Number.POSITIVE_INFINITY) && now < 10_000) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, texts)
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  return page.evaluate(() => {
    const seen: unknown = Reflect.get(window, '__firstSeen')
    return Array.isArray(seen) ? seen.map(Number) : []
  })
}

async function expectSeenWithin(page: Page, screen: string, path: string, texts: string[]) {
  const seen = await firstSeen(page, `${new URL(page.url()).origin}${path}`, texts)
  test.info().annotations.push({
    type: 'rendimiento',
    description: `${screen}, a la vista: ${seen.map(Math.round).join(', ')} ms`,
  })
  ;[...texts, 'la foto'].forEach((text, index) => {
    expect(seen[index], `«${text}» en ${screen}, en ms`).toBeLessThan(LCP_MS)
  })
}

// Covers: criterios 1, 2 y 5 de #334
test('«¿A quién se lo diste?» y «Tu camada» abren dentro de los 150 KB en el teléfono', async ({
  page,
}) => {
  test.setTimeout(400_000)
  let closing: Closing | null = null
  try {
    closing = await closingRescuer()
    const panel = panelPath(closing.litter)
    const young = closing.young.get('Cría 5') ?? ''
    await signIn(page, closing.owner.email, '/mis-animales')
    await expect(page).toHaveURL(/mis-animales/)
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const luna = await measure(page, `${origin}${handoverPath(closing.luna)}`)
    const youngOne = await measure(page, `${origin}${handoverPath(young, panel)}`)
    const mora = await measure(page, `${origin}${handoverPath(closing.mora)}`)
    const litter = await measure(page, `${origin}${panel}`)

    expectWithin('«¿A quién se la diste?» de Luna', luna, HANDOVER_TOTAL_KB)
    expectWithin('«¿A quién se la diste?» de una cría', youngOne, YOUNG_HANDOVER_TOTAL_KB)
    expectWithin('«Marcar adoptada a Mora», sin aceptadas', mora, OUTSIDE_ONLY_TOTAL_KB)
    expectWithin('«Tu camada» con 10 crías', litter, LITTER_PANEL_TOTAL_KB)

    await expectSeenWithin(page, '«¿A quién se la diste?» de Luna', handoverPath(closing.luna), [
      '¿A quién se la diste?',
      'Ana Prueba',
      'Beto Prueba',
    ])
    await expectSeenWithin(
      page,
      '«¿A quién se la diste?» de una cría',
      handoverPath(young, panel),
      ['¿A quién se la diste?', 'Ana Prueba', 'Beto Prueba'],
    )
    await expectSeenWithin(page, '«Marcar adoptada a Mora»', handoverPath(closing.mora), [
      'Marcar adoptada a Mora',
      'Sin una solicitud aceptada, no queda compromiso',
      FOUND_VIA,
    ])
    await expectSeenWithin(page, '«Tu camada»', panel, [LITTER, 'Las crías', STATS])
  } finally {
    await cleanUp(closing)
  }
})

function row(page: Page, name: string) {
  return page.locator('li').filter({ has: page.getByRole('heading', { level: 3, name }) })
}

async function tapAndExpect(page: Page, name: string, tap: () => Promise<void>, answer: Answer[]) {
  const ms = await timeTap(page, name, tap, answer)
  expectAnswered(name, ms)
}

// Dos toques seguidos: el botón contesta trabajando, el aviso de cómo quedó llega, y la acción sale
// una sola vez.
async function busyTap(
  page: Page,
  actions: SlowActions,
  {
    button,
    label,
    done,
    screen,
  }: { button: () => Locator; label: string; done: RegExp; screen: string },
) {
  actions.reset()
  await tapAndExpect(page, `«${label}» en ${screen}`, () => button().dblclick(), [
    { selector: 'button[aria-busy="true"]', text: label },
  ])
  await expect(page.getByText(done).first()).toBeVisible({ timeout: 30_000 })
  expect(actions.count(), `«${label}» tocado dos veces, acciones que salieron`).toBe(1)
}

for (const motion of MOTIONS) {
  // Covers: criterios 3, 4 y 5 de #334
  test(`cada toque de «¿A quién se lo diste?» y «Tu camada» contesta en menos de 200 ms (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(400_000)
    let closing: Closing | null = null
    try {
      closing = await closingRescuer()
      const panel = panelPath(closing.litter)
      await page.emulateMedia({ reducedMotion: motion })
      await signIn(page, closing.owner.email, '/mis-animales')
      await expect(page).toHaveURL(/mis-animales/)
      const origin = new URL(page.url()).origin
      await throttleLikeAPhone(page)
      const actions = await slowActions(page)

      const handover = `«¿A quién se la diste?» (${motion})`
      await settled(page, `${origin}${handoverPath(closing.luna)}`)
      await tapAndExpect(
        page,
        `Elegir a Ana en ${handover}`,
        () => page.getByRole('radio', { name: /Ana Prueba/ }).click(),
        [{ selector: 'label:has(input:checked)', text: 'Ana Prueba' }],
      )
      await tapAndExpect(
        page,
        `«${OUTSIDE}» en ${handover}`,
        () => page.getByRole('radio', { name: OUTSIDE }).click(),
        [{ selector: 'label:has(input:checked)', text: OUTSIDE }],
      )
      await tapAndExpect(
        page,
        `«Instagram» en ${handover}`,
        () => page.getByRole('radio', { name: 'Instagram', exact: true }).click(),
        [{ selector: 'label:has(input:checked)', text: 'Instagram' }],
      )
      await page.getByRole('radio', { name: /Ana Prueba/ }).click()
      const confirm = page.getByRole('button', { name: CONFIRM_ANA })
      actions.reset()
      await tapAndExpect(page, `«${CONFIRM_ANA}» en ${handover}`, () => confirm.dblclick(), [
        { selector: 'button[aria-busy="true"]', text: CONFIRM_ANA },
      ])
      await expect(page).toHaveURL(/\/mis-animales\?adoptado=/, { timeout: 30_000 })
      expect(actions.count(), 'marcar adoptada tocado dos veces, acciones que salieron').toBe(1)
      expect(await adoptionsOf(closing.luna), 'adopciones de Luna').toBe(1)

      const outsideOnly = `«Marcar adoptada a Mora» (${motion})`
      await settled(page, `${origin}${handoverPath(closing.mora)}`)
      await tapAndExpect(
        page,
        `«Un grupo o una página de Facebook» en ${outsideOnly}`,
        () => page.getByRole('radio', { name: 'Un grupo o una página de Facebook' }).click(),
        [{ selector: 'label:has(input:checked)', text: 'Un grupo o una página de Facebook' }],
      )
      actions.reset()
      await tapAndExpect(
        page,
        `«Marcar adoptada» en ${outsideOnly}`,
        () => page.getByRole('button', { name: 'Marcar adoptada', exact: true }).dblclick(),
        [{ selector: 'button[aria-busy="true"]', text: 'Marcar adoptada' }],
      )
      await expect(page).toHaveURL(/\/mis-animales\?adoptado=/, { timeout: 30_000 })
      expect(actions.count(), 'marcar adoptada por fuera, acciones que salieron').toBe(1)
      expect(await adoptionsOf(closing.mora), 'adopciones de Mora').toBe(1)

      const litter = `«Tu camada» (${motion})`
      await settled(page, `${origin}${panel}`)
      await busyTap(page, actions, {
        button: () => row(page, 'Cría 6').getByRole('button', { name: 'Marcar en proceso' }),
        label: 'Marcar en proceso',
        done: /Cría 6 está en proceso/,
        screen: litter,
      })
      await busyTap(page, actions, {
        button: () => row(page, 'Cría 1').getByRole('button', { name: 'Marcar disponible' }),
        label: 'Marcar disponible',
        done: /Cría 1 está disponible/,
        screen: litter,
      })
      await tapAndExpect(
        page,
        `«Marcar disponible» de la adoptada en ${litter}`,
        () => row(page, 'Cría 3').getByRole('button', { name: 'Marcar disponible' }).click(),
        [{ selector: '[role="dialog"]', text: 'Cría 3' }],
      )
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await busyTap(page, actions, {
        button: () => page.getByRole('button', { name: 'Renovar', exact: true }),
        label: 'Renovar',
        done: /^Renovada hasta el /,
        screen: litter,
      })
      await busyTap(page, actions, {
        button: () => page.getByRole('button', { name: 'Pausar', exact: true }),
        label: 'Pausar',
        done: new RegExp(`${LITTER} quedó pausada`),
        screen: litter,
      })
      // Pausada, cada cría que no se dio todavía se puede marcar adoptada: el enlace trabaja hasta
      // que aparece su pantalla.
      await tapAndExpect(
        page,
        `«Marcar adoptada» de una cría en ${litter}`,
        () => row(page, 'Cría 7').getByRole('link', { name: 'Marcar adoptada' }).click(),
        [{ selector: 'a:has([data-link-opening])', text: 'Marcar adoptada' }],
      )
      await expect(
        page.getByRole('heading', { level: 1, name: /^Marcar adoptada a Cría 7/ }),
      ).toBeVisible({
        timeout: 30_000,
      })
    } finally {
      await cleanUp(closing)
    }
  })
}

// La acción del servidor llega pero la respuesta se pierde (`answered: false`), o ni sale.
async function cutActions(page: Page) {
  let mode: 'up' | 'lost' | 'down' = 'up'
  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const isAction = request.method() === 'POST' && request.headers()['next-action'] !== undefined
    if (!isAction || mode === 'up') return route.fallback()
    if (mode === 'lost') await route.fetch()
    return route.abort('internetdisconnected')
  })
  return {
    set: (next: 'up' | 'lost' | 'down') => {
      mode = next
    },
  }
}

// Covers: criterio 4 de #334
test('sin señal, marcar adoptada deja lo elegido, el reintento marca una sola vez y la pregunta que no llega avisa', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let closing: Closing | null = null
  try {
    closing = await closingRescuer(3)
    await signIn(page, closing.owner.email, handoverPath(closing.luna))
    await expect(
      page.getByRole('heading', { level: 1, name: '¿A quién se la diste?' }),
    ).toBeVisible()
    const origin = new URL(page.url()).origin
    const cut = await cutActions(page)

    // Llega a la base y la respuesta se pierde: el aviso de siempre, con Ana elegida.
    await settled(page, `${origin}${handoverPath(closing.luna)}`)
    const ana = page.getByRole('radio', { name: /Ana Prueba/ })
    await ana.click()
    const confirm = page.getByRole('button', { name: CONFIRM_ANA })
    cut.set('lost')
    await confirm.click()
    await expect(
      page.getByText(`No se pudo: el sitio no respondió. Tocá «${CONFIRM_ANA}» de nuevo.`),
    ).toBeVisible({ timeout: 30_000 })
    await expect(ana).toBeChecked()
    cut.set('up')
    await confirm.click()
    await expect(page).toHaveURL(/\/mis-animales\?adoptado=/, { timeout: 30_000 })
    expect(await adoptionsOf(closing.luna), 'adopciones de Luna después del reintento').toBe(1)

    // Por fuera, sin que salga: el aviso, con el canal todavía elegido.
    await settled(page, `${origin}${handoverPath(closing.mora)}`)
    const facebook = page.getByRole('radio', { name: 'Un grupo o una página de Facebook' })
    await facebook.click()
    cut.set('down')
    await page.getByRole('button', { name: 'Marcar adoptada', exact: true }).click()
    await expect(
      page.getByText('No se pudo: el sitio no respondió. Tocá «Marcar adoptada» de nuevo.'),
    ).toBeVisible({ timeout: 30_000 })
    await expect(facebook).toBeChecked()
    expect(await adoptionsOf(closing.mora), 'adopciones de Mora sin señal').toBe(0)
    cut.set('up')
    await page.getByRole('button', { name: 'Marcar adoptada', exact: true }).click()
    await expect(page).toHaveURL(/\/mis-animales\?adoptado=/, { timeout: 30_000 })
    expect(await adoptionsOf(closing.mora), 'adopciones de Mora después del reintento').toBe(1)

    // La pregunta de terminar la adopción de una cría no llega: el botón trabaja y deja «Reintentar».
    const layer = await cutLayer(page, OVERLAY_LAYER)
    layer.set('down')
    await page.goto(`${origin}${panelPath(closing.litter)}`, { waitUntil: 'load' })
    const end = row(page, 'Cría 3').getByRole('button', { name: 'Marcar disponible' })
    await expect(end).toBeVisible()
    await page.waitForLoadState('networkidle')
    await end.click()
    await expect(partFailedNotice(page)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('dialog')).toHaveCount(0)
  } finally {
    await cleanUp(closing)
  }
})
