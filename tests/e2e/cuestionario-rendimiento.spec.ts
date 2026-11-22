import { expect, test, type Page, type Route } from '@playwright/test'
import { sendApplication } from './support/applications'
import { cutLayer } from './support/cut-layer'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import {
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  measure,
  type Measured,
} from './support/screen-budget'
import { settled, slowActions } from './support/slow-server'
import { expectAnswered, timeTap, type Answer } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #336: «Quiero adoptar» y cada toque del cuestionario contestan en menos de 200 ms con red y
// procesador de teléfono de gama media (docs/07 §Presupuesto de performance), medidos en el
// cuestionario más largo: Luna sin castrar, con la pregunta propia de Carla y vivienda alquilada. Los
// totales de `main` antes de #336, redondeados hacia arriba al décimo de KB, impiden esconder peso de
// apertura corriéndolo a después de abrir.
const APPLY_TOTAL_KB = 175.3
const YOUNG_APPLY_TOTAL_KB = 175.3
const MOTIONS = ['no-preference', 'reduce'] as const
const SLOW_PAGE_MS = 3_000
const OWN = '¿Cómo es un día tuyo de semana?'
const WHY = '¿Por qué Luna?'
const NEXT_FAILED =
  'No se pudo seguir: no hay conexión. Tus respuestas siguen acá; tocá «Siguiente» de nuevo.'
// Solo está en el archivo de las reglas del cuestionario, que baja después de abrir.
const RULES_LAYER = 'applications.errors.text_required'

test.use({ viewport: { width: 390, height: 844 } })

type Step =
  | { kind: 'choice'; question: string; answer: string }
  | { kind: 'text'; question: string; answer: string; timed?: true }

// Todas las preguntas que le pueden tocar a alguien, en el orden del cuestionario de Luna.
const LUNA_STEPS: Step[] = [
  { kind: 'choice', question: '¿Dónde vivís?', answer: 'Casa' },
  { kind: 'choice', question: '¿Es propia o alquilada?', answer: 'Alquilada' },
  { kind: 'choice', question: '¿El contrato o el dueño permite animales?', answer: 'Sí' },
  { kind: 'choice', question: '¿Tenés patio o balcón?', answer: 'Patio' },
  { kind: 'text', question: '¿Quiénes viven en la casa?', answer: 'Mi pareja y yo.' },
  { kind: 'text', question: '¿Hay otros animales en la casa?', answer: 'Ninguno.' },
  { kind: 'choice', question: '¿Cuántas horas por día estaría sin compañía?', answer: 'De 4 a 8' },
  {
    kind: 'text',
    question: '¿Qué pasa con el animal si te mudás o te vas de viaje?',
    answer: 'Se viene.',
  },
  { kind: 'text', question: '¿Tuviste perros o gatos antes?', answer: 'Una perra.' },
  { kind: 'choice', question: '¿Te comprometés a castrar a Luna?', answer: 'Sí' },
  {
    kind: 'choice',
    question: '¿Contás con plata para vacunas, castración y una urgencia del veterinario?',
    answer: 'Justo',
  },
  { kind: 'text', question: OWN, answer: 'En casa.', timed: true },
  { kind: 'text', question: WHY, answer: 'Es tranquila.', timed: true },
]

// Tobi está castrado y la vivienda es propia: sin el permiso del dueño ni la castración.
const TOBI_STEPS: Step[] = LUNA_STEPS.filter(
  (step) =>
    step.question !== '¿El contrato o el dueño permite animales?' &&
    step.question !== '¿Te comprometés a castrar a Luna?' &&
    step.question !== OWN,
).map((step) => {
  if (step.question === '¿Es propia o alquilada?') return { ...step, answer: 'Propia' }
  if (step.question === WHY) return { kind: 'text', question: '¿Por qué Tobi?', answer: 'Sí.' }
  return step
})

type Run = {
  owner: { id: string; email: string }
  luna: string
  mora: string
  tobi: string
  litter: string
  young: string
}

async function update(code: string, values: Record<string, unknown>): Promise<void> {
  const { error } = await service().from('pets').update(values).eq('code', code)
  expect(error).toBeNull()
}

async function carlasPets(): Promise<Run> {
  const { owner, pets } = await publishForRun(
    [
      { name: 'Mora', species: 'dog', isNeutered: false },
      { name: 'Tobi', species: 'dog', isNeutered: true },
      { name: 'Luna', species: 'dog', isNeutered: false },
    ],
    { photo: { grain: true } },
  )
  const code = (name: string) => pets.find((pet) => pet.name === name)?.code ?? ''
  const { error } = await service()
    .from('profiles')
    .update({ display_name: 'Carla Prueba' })
    .eq('id', owner.id)
  expect(error).toBeNull()
  await update(code('Luna'), { own_question: OWN })
  await update(code('Tobi'), { required_level: 2 })
  const litter = await publishLitterForRun(owner.id, 2, { photo: { grain: true } })
  const { data } = await service()
    .from('pets')
    .select('code')
    .eq('litter_id', litter.id)
    .order('name')
    .limit(1)
    .single()
  return {
    owner,
    luna: code('Luna'),
    mora: code('Mora'),
    tobi: code('Tobi'),
    litter: litter.code,
    young: String(data?.code ?? ''),
  }
}

async function petId(code: string): Promise<string> {
  const { data } = await service().from('pets').select('id').eq('code', code).single()
  return String(data?.id ?? '')
}

async function rowsOf(table: 'applications' | 'held_applications', person: Person, code: string) {
  const { count } = await service()
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('applicant_id', person.id)
    .eq('pet_id', await petId(code))
  return count ?? 0
}

async function identityInReview(person: Person): Promise<void> {
  const { error } = await service()
    .from('identity_requests')
    .insert({
      user_id: person.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
      origin: 'profile',
    })
  expect(error).toBeNull()
}

// El sitio tarda 3 segundos en contestar cada pantalla del cuestionario que se pide desde adentro.
// Devuelve cuántas se pidieron desde un «Quiero adoptar», para ver que dos toques abren una sola.
async function slowApplyPages(page: Page): Promise<{ taps: () => number }> {
  let taps = 0
  await page.route('**/solicitar/**', async (route: Route) => {
    const request = route.request()
    if (request.method() === 'GET' && request.headers().rsc !== undefined) {
      if (request.url().includes('toque=')) taps += 1
      await new Promise((resolve) => setTimeout(resolve, SLOW_PAGE_MS))
    }
    await route.fallback()
  })
  return { taps: () => taps }
}

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

async function tapAndExpect(page: Page, name: string, tap: () => Promise<void>, answer: Answer[]) {
  const ms = await timeTap(page, name, tap, answer)
  expectAnswered(name, ms)
}

const question = (step: Step): Answer =>
  step.kind === 'choice'
    ? { selector: 'legend', text: step.question }
    : { selector: 'label', text: step.question }

// Letra por letra, como en el teclado del teléfono, y cada una tiene que verse en 200 ms.
async function typeTimed(page: Page, step: Step, screen: string) {
  await page.getByRole('textbox', { name: step.question }).focus()
  let typed = ''
  for (const char of step.answer) {
    typed += char
    // oxlint-disable-next-line no-await-in-loop -- letra por letra, como se escribe
    await tapAndExpect(
      page,
      `«${char}» de «${step.answer}» en «${step.question}» (${screen})`,
      () => page.keyboard.type(char),
      [{ selector: 'textarea', value: typed }],
    )
  }
}

async function answerStep(page: Page, step: Step, screen: string, timed: boolean) {
  if (step.kind === 'choice') {
    const radio = page
      .getByRole('group', { name: step.question })
      .getByRole('radio', { name: step.answer, exact: true })
    if (!timed) return radio.check()
    return tapAndExpect(
      page,
      `Elegir «${step.answer}» en «${step.question}» (${screen})`,
      () => radio.click(),
      [{ selector: 'label:has(input:checked)', text: step.answer }],
    )
  }
  if (timed && step.timed === true) return typeTimed(page, step, screen)
  return page.getByRole('textbox', { name: step.question }).fill(step.answer)
}

// Cada vuelta al cuestionario arranca sin el borrador de la anterior, en la primera pregunta.
async function openFresh(page: Page, url: string, waitUntil: 'commit' | 'load') {
  await page.evaluate(() => {
    window.localStorage.clear()
  })
  await page.goto(url, { waitUntil })
}

const nextButton = (page: Page) => page.getByRole('button', { name: 'Siguiente', exact: true })

// Contesta cada pregunta y toca «Siguiente»; con `timed`, mide cada toque, también «Anterior» una
// vez. Termina en la última, contestada.
async function walk(page: Page, steps: Step[], screen: string, timed: boolean) {
  for (const [index, step] of steps.entries()) {
    // oxlint-disable-next-line no-await-in-loop -- una pregunta por pantalla, en orden
    await answerStep(page, step, screen, timed)
    const following = steps[index + 1]
    if (following === undefined) return
    if (!timed) {
      // oxlint-disable-next-line no-await-in-loop
      await nextButton(page).click()
      continue
    }
    // oxlint-disable-next-line no-await-in-loop
    await tapAndExpect(
      page,
      `«Siguiente» en «${step.question}» (${screen})`,
      () => nextButton(page).click(),
      [question(following)],
    )
    if (index !== 0) continue
    // oxlint-disable-next-line no-await-in-loop
    await tapAndExpect(
      page,
      `«Anterior» en «${following.question}» (${screen})`,
      () => page.getByRole('button', { name: 'Anterior', exact: true }).click(),
      [question(step)],
    )
    // oxlint-disable-next-line no-await-in-loop
    await nextButton(page).click()
    // oxlint-disable-next-line no-await-in-loop
    await expect(page.locator('legend', { hasText: following.question })).toBeVisible()
  }
}

async function cleanUp(run: Run | null, people: Person[]) {
  await Promise.all(people.map((person) => removePerson(person)))
  if (run !== null) await removeRunOwner(run.owner.id)
}

// Covers: criterio 5 de #336
test('el cuestionario más largo abre dentro de los 150 KB en el teléfono', async ({ page }) => {
  test.setTimeout(300_000)
  let run: Run | null = null
  const ana = await newPerson('Ana Prueba', { level: 1 })
  try {
    run = await carlasPets()
    await signIn(page, ana.email, `/solicitar/${run.luna}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitar a Luna' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)
    expectWithin(
      'El cuestionario de Luna',
      await measure(page, `${origin}/solicitar/${run.luna}`),
      APPLY_TOTAL_KB,
    )
    expectWithin(
      'El cuestionario de una cría',
      await measure(page, `${origin}/solicitar/${run.young}?camada=${run.litter}`),
      YOUNG_APPLY_TOTAL_KB,
    )
  } finally {
    await cleanUp(run, [ana])
  }
})

for (const motion of MOTIONS) {
  // Covers: criterios 1, 2, 4 y 5 de #336
  test(`«Quiero adoptar» y cada toque del cuestionario contestan en menos de 200 ms (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(600_000)
    let run: Run | null = null
    const ana = await newPerson('Ana Prueba', { level: 1 })
    const beto = await newPerson('Beto Prueba', { level: 1 })
    const dani = await newPerson('Dani Prueba', { level: 1 })
    try {
      run = await carlasPets()
      await sendApplication(beto.id, run.mora, {
        housing_type: 'house',
        housing_tenure: 'rented',
        rental_allows_pets: 'yes',
        neuter_commitment: 'yes',
      })
      await identityInReview(dani)
      await page.emulateMedia({ reducedMotion: motion })
      await signIn(page, ana.email, `/animales/${run.luna}`)
      await expect(page.getByRole('heading', { level: 1, name: 'Luna' })).toBeVisible()
      const origin = new URL(page.url()).origin
      await throttleLikeAPhone(page)
      const pages = await slowApplyPages(page)
      await slowActions(page)

      const opening = (text: string): Answer[] => [{ selector: 'a:has([data-link-opening])', text }]
      await settled(page, `${origin}/animales/${run.luna}`)
      await tapAndExpect(
        page,
        `«Quiero adoptar» en la ficha de Luna (${motion})`,
        () => page.getByRole('link', { name: 'Quiero adoptar' }).dblclick(),
        opening('Quiero adoptar'),
      )
      await page.waitForTimeout(SLOW_PAGE_MS / 2)
      await expect(page.locator('a:has([data-link-opening])')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1, name: 'Solicitar a Luna' })).toBeVisible({
        timeout: 30_000,
      })
      expect(pages.taps(), '«Quiero adoptar» tocado dos veces, pantallas pedidas').toBe(1)

      await settled(page, `${origin}/camadas/${run.litter}`)
      await tapAndExpect(
        page,
        `«Quiero adoptar» de una cría en su camada (${motion})`,
        () => page.getByRole('link', { name: 'Quiero adoptar' }).first().dblclick(),
        opening('Quiero adoptar'),
      )
      await expect(page.getByRole('heading', { level: 1, name: /^Solicitar a Cría/ })).toBeVisible({
        timeout: 30_000,
      })
      expect(pages.taps(), '«Quiero adoptar» de la cría tocado dos veces, pantallas pedidas').toBe(
        2,
      )

      const screen = `el cuestionario de Luna (${motion})`
      await settled(page, `${origin}/solicitar/${run.luna}`)
      await walk(page, LUNA_STEPS, screen, true)
      await tapAndExpect(
        page,
        `«Enviar solicitud» tocado dos veces en ${screen}`,
        () => page.getByRole('button', { name: 'Enviar solicitud' }).dblclick(),
        [{ selector: 'button[aria-busy="true"]', text: 'Enviar solicitud' }],
      )
      await expect(page).toHaveURL(/\/enviada\?solicitud=/, { timeout: 30_000 })
      expect(await rowsOf('applications', ana, run.luna), 'solicitudes de Ana por Luna').toBe(1)

      // Con las respuestas de su solicitud por Mora, Beto arranca en la pregunta de Carla.
      await page.context().clearCookies()
      await signIn(page, beto.email, `/solicitar/${run.luna}`)
      await settled(page, `${origin}/solicitar/${run.luna}`)
      await page.getByRole('textbox', { name: OWN }).fill('En casa.')
      await nextButton(page).click()
      await expect(page.getByRole('textbox', { name: WHY })).toBeVisible()
      await tapAndExpect(
        page,
        `«Cambiar» «¿Dónde vivís?» en el repaso de ${screen}`,
        () => page.getByRole('button', { name: 'Cambiar: ¿Dónde vivís?' }).click(),
        [{ selector: 'legend', text: '¿Dónde vivís?' }],
      )

      const held = `el cuestionario de Tobi para dejarla escrita (${motion})`
      await page.context().clearCookies()
      await signIn(page, dani.email, `/solicitar/${run.tobi}?esperar=1`)
      await settled(page, `${origin}/solicitar/${run.tobi}?esperar=1`)
      await walk(page, TOBI_STEPS, held, false)
      await tapAndExpect(
        page,
        `«Dejar escrita mi solicitud» tocado dos veces en ${held}`,
        () => page.getByRole('button', { name: 'Dejar escrita mi solicitud' }).dblclick(),
        [{ selector: 'button[aria-busy="true"]', text: 'Dejar escrita mi solicitud' }],
      )
      await expect(page).toHaveURL(/\/dejada\?id=/, { timeout: 30_000 })
      expect(await rowsOf('held_applications', dani, run.tobi), 'escritas de Dani por Tobi').toBe(1)
    } finally {
      await cleanUp(run, [ana, beto, dani])
    }
  })
}

// Covers: criterios 2 y 3 de #336
test('«Siguiente» tocado antes de que lleguen las reglas trabaja, sigue solo y avisa si no llegan', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let run: Run | null = null
  const ana = await newPerson('Ana Prueba', { level: 1 })
  try {
    run = await carlasPets()
    await signIn(page, ana.email, `/animales/${run.luna}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Luna' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    const rules = await cutLayer(page, RULES_LAYER)
    const casa = page
      .getByRole('group', { name: '¿Dónde vivís?' })
      .getByRole('radio', { name: 'Casa', exact: true })
    const tenure = page.locator('legend', { hasText: '¿Es propia o alquilada?' })

    // Elegida apenas aparece, sigue elegida cuando la pantalla termina de abrir.
    rules.set('hold')
    await openFresh(page, `${origin}/solicitar/${run.luna}`, 'commit')
    await casa.check()
    await page.waitForLoadState('load')
    await page.waitForTimeout(2_000)
    await expect(casa).toBeChecked()

    await tapAndExpect(page, '«Siguiente» antes de las reglas', () => nextButton(page).click(), [
      { selector: 'button[aria-busy="true"]', text: 'Siguiente' },
    ])
    await nextButton(page).dispatchEvent('click')
    await rules.release()
    await expect(tenure).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(NEXT_FAILED)).toHaveCount(0)

    // Sin las reglas en 10 segundos, el aviso con lo contestado a la vista; volver a tocar sigue.
    rules.set('hold')
    await openFresh(page, `${origin}/solicitar/${run.luna}`, 'load')
    await casa.check()
    await nextButton(page).click()
    await expect(page.getByText(NEXT_FAILED)).toBeVisible({ timeout: 20_000 })
    await expect(casa).toBeChecked()
    await expect(nextButton(page)).not.toHaveAttribute('aria-busy', 'true')
    await rules.release()
    await nextButton(page).click()
    await expect(tenure).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(NEXT_FAILED)).toHaveCount(0)

    // Sin señal, lo mismo, y volver a tocar lo pide de nuevo.
    rules.set('down')
    await openFresh(page, `${origin}/solicitar/${run.luna}`, 'load')
    await casa.check()
    await nextButton(page).click()
    await expect(page.getByText(NEXT_FAILED)).toBeVisible({ timeout: 20_000 })
    await expect(casa).toBeChecked()
    rules.set('up')
    await nextButton(page).click()
    await expect(tenure).toBeVisible({ timeout: 15_000 })
  } finally {
    await cleanUp(run, [ana])
  }
})
