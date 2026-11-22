import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import { makePhotos, pick } from './support/big-photos'
import { cutLayer, OVERLAY_LAYER } from './support/cut-layer'
import {
  addPetPhotos,
  publishForRun,
  publishLitterForRun,
  removeRunOwner,
} from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
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

// Historia #338: «Publicar una camada», editar una camada y editar un animal entran al presupuesto
// de las pantallas con sesión (docs/07 §Presupuesto de performance), con red y procesador de
// teléfono de gama media. Los totales de `main` antes de #338, redondeados hacia arriba al décimo de
// KB, impiden esconder peso de apertura corriéndolo a después de abrir.
const PUBLISH_LITTER_TOTAL_KB = 240.9
const EDIT_LITTER_TOTAL_KB = 239.3
const EDIT_PET_TOTAL_KB = 223.2
const MOTIONS = ['no-preference', 'reduce'] as const
const LITTER = 'La camada de Luna'
const LEAVING = 'Tenés cambios sin guardar'
// «Mis animales» con el aviso de lo publicado o lo guardado, o ya sin él.
const SAVED = /\/mis-animales(\?guardado=\w+)?$/u

test.use({ viewport: { width: 390, height: 844 } })

// Pasar de una pantalla con cambios a la siguiente pregunta antes de irse: la prueba sale.
test.beforeEach(({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept())
})

type Editing = {
  owner: { id: string; email: string }
  luna: string
  litter: string
  young: Map<string, string>
}

// La versión más pesada de cada pantalla (decisión de #338): Luna con 5 fotos, el máximo, y una
// camada de 10 crías, también el máximo, con la foto de la camada, una por cría y tres en la 1, la 2
// y la 3.
async function editingRescuer(): Promise<Editing> {
  const { owner, pets } = await publishForRun([{ name: 'Luna', species: 'dog' }], {
    photo: { grain: true },
  })
  const { data: pet } = await service()
    .from('pets')
    .select('id')
    .eq('code', pets[0]?.code ?? '')
    .single()
  const luna = String(pet?.id ?? '')
  await addPetPhotos(owner.id, luna, 4, { photo: { grain: true } })
  const litter = await publishLitterForRun(owner.id, 10, { photo: { grain: true } })
  const { data } = await service().from('pets').select('id, name').eq('litter_id', litter.id)
  const young = new Map((data ?? []).map((one) => [String(one.name), String(one.id)]))
  for (const name of ['Cría 1', 'Cría 2', 'Cría 3']) {
    // oxlint-disable-next-line no-await-in-loop -- una cría por vez
    await addPetPhotos(owner.id, young.get(name) ?? '', 2, { photo: { grain: true } })
  }
  return { owner, luna, litter: litter.id, young }
}

const PUBLISH_LITTER = '/mis-animales/publicar?tipo=camada'
const editLitterPath = (id: string) => `/mis-animales/camadas/${id}/editar`
const editPetPath = (id: string) => `/mis-animales/${id}/editar`

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

type Seen = { text?: string; value?: string }

// En qué cuadro se vio por primera vez cada texto o cada campo con su valor, en ms desde que empezó
// a abrir: el título y los primeros campos con lo cargado tienen que estar a la vista antes de los
// 2,5 s.
async function firstSeen(page: Page, path: string, wanted: Seen[]): Promise<number[]> {
  await page.addInitScript((targets) => {
    const seen: number[] = targets.map(() => Number.POSITIVE_INFINITY)
    Reflect.set(window, '__firstSeen', seen)
    const textShown = (text: string) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement
        if (node.textContent?.includes(text) === true && parent?.checkVisibility() === true) {
          return true
        }
      }
      return false
    }
    const valueShown = (value: string) =>
      Array.from(document.querySelectorAll('main input, main textarea')).some(
        (field) =>
          (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) &&
          field.value === value &&
          field.checkVisibility(),
      )
    const frame = (now: number) => {
      if (document.body !== null) {
        targets.forEach((target, index) => {
          if (seen[index] !== Number.POSITIVE_INFINITY) return
          const shown =
            target.text === undefined ? valueShown(target.value ?? '') : textShown(target.text)
          if (shown) seen[index] = now
        })
      }
      if (seen.includes(Number.POSITIVE_INFINITY) && now < 10_000) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, wanted)
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  return page.evaluate(() => {
    const seen: unknown = Reflect.get(window, '__firstSeen')
    return Array.isArray(seen) ? seen.map(Number) : []
  })
}

async function expectSeenWithin(page: Page, screen: string, path: string, wanted: Seen[]) {
  const seen = await firstSeen(page, `${new URL(page.url()).origin}${path}`, wanted)
  test.info().annotations.push({
    type: 'rendimiento',
    description: `${screen}, a la vista: ${seen.map(Math.round).join(', ')} ms`,
  })
  wanted.forEach((target, index) => {
    expect(seen[index], `«${target.text ?? target.value}» en ${screen}, en ms`).toBeLessThan(LCP_MS)
  })
}

// Covers: criterios 1 y 5 de #338
test('«Publicar una camada», editar una camada y editar un animal abren dentro de los 150 KB en el teléfono', async ({
  page,
}) => {
  test.setTimeout(400_000)
  let editing: Editing | null = null
  try {
    editing = await editingRescuer()
    await signIn(page, editing.owner.email, '/mis-animales')
    await expect(page).toHaveURL(/mis-animales/)
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const publish = await measure(page, `${origin}${PUBLISH_LITTER}`)
    const litter = await measure(page, `${origin}${editLitterPath(editing.litter)}`)
    const luna = await measure(page, `${origin}${editPetPath(editing.luna)}`)

    expectWithin('«Publicar una camada»', publish, PUBLISH_LITTER_TOTAL_KB)
    expectWithin('Editar una camada de 10 crías', litter, EDIT_LITTER_TOTAL_KB)
    expectWithin('Editar a Luna, con 5 fotos', luna, EDIT_PET_TOTAL_KB)

    await expectSeenWithin(page, '«Publicar una camada»', PUBLISH_LITTER, [
      { text: 'Publicar una camada' },
      { text: 'Nombre de la camada' },
      { value: 'Cría 1' },
    ])
    await expectSeenWithin(page, 'Editar una camada', editLitterPath(editing.litter), [
      { text: `Editar «${LITTER}»` },
      { value: LITTER },
      { value: 'Cría 1' },
    ])
    await expectSeenWithin(page, 'Editar a Luna', editPetPath(editing.luna), [
      { text: 'Editar a Luna' },
      { value: 'Luna' },
    ])
  } finally {
    if (editing !== null) await removeRunOwner(editing.owner.id)
  }
})

const young = (page: Page, name: string) => page.getByRole('group', { name, exact: true })

async function tapAndExpect(page: Page, name: string, tap: () => Promise<void>, answer: Answer[]) {
  const ms = await timeTap(page, name, tap, answer)
  expectAnswered(name, ms)
}

// Lo que se escribe se mira por el id del campo: el nombre de una cría es también el título de su
// grupo, y cambia con cada letra.
async function idOf(field: Locator): Promise<string> {
  return (await field.getAttribute('id')) ?? ''
}

// Letra por letra al final de lo que ya dice, como se corrige un nombre.
async function typeAtEnd(
  page: Page,
  screen: string,
  field: Locator,
  what: string,
  letters: string,
) {
  const id = await idOf(field)
  await field.click()
  await page.keyboard.press('End')
  let typed = await field.inputValue()
  for (const letter of letters) {
    typed += letter
    // oxlint-disable-next-line no-await-in-loop -- letra por letra, como se escribe
    await tapAndExpect(
      page,
      `«${letter}» en ${what}, ${screen}`,
      () => page.keyboard.press(letter),
      [{ selector: `[id="${id}"]`, value: typed }],
    )
  }
}

async function chooseSex(page: Page, screen: string, group: Locator, sex: 'Hembra' | 'Macho') {
  const radio = group.getByRole('radio', { name: sex, exact: true })
  const name = (await radio.getAttribute('name')) ?? ''
  const value = sex === 'Hembra' ? 'female' : 'male'
  await tapAndExpect(page, `«${sex}» en ${screen}`, () => radio.click(), [
    { selector: `input[name="${name}"][value="${value}"]`, checked: true },
  ])
}

// Tocar «Agregá fotos» contesta cuando el navegador abre la galería, que queda abierta sin elegir.
async function chooseTap(page: Page, name: string, add: Locator): Promise<void> {
  const chooser = page.waitForEvent('filechooser', { timeout: 10_000 })
  await tapAndExpect(page, name, () => add.click(), [])
  await chooser
}

const addPhotos = (scope: Page | Locator) => scope.getByRole('button', { name: 'Agregá fotos' })

const preparing = (page: Page) => page.getByRole('img', { name: /^Foto \d$/ })

// Tres fotos de 12 MP elegidas en el campo con ese id: los toques que siguen caen mientras se
// preparan (la prueba lo comprueba antes del primero).
async function pickThree(page: Page, inputId: string) {
  const before = await preparing(page).count()
  await pick(page, 0, 3, inputId)
  return { before, ready: () => preparing(page).count() }
}

async function expectStillPreparing(screen: string, ready: () => Promise<number>, before: number) {
  expect(await ready(), `fotos listas en ${screen} al empezar a tocar`).toBeLessThan(before + 3)
}

for (const motion of MOTIONS) {
  // Covers: criterio 2 y 5 de #338
  test(`cada toque de las tres pantallas contesta en menos de 200 ms con fotos preparándose (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(600_000)
    let editing: Editing | null = null
    try {
      editing = await editingRescuer()
      await page.emulateMedia({ reducedMotion: motion })
      await signIn(page, editing.owner.email, '/mis-animales')
      await expect(page).toHaveURL(/mis-animales/)
      const origin = new URL(page.url()).origin
      await slowActions(page)
      await throttleLikeAPhone(page)

      // «Publicar una camada», vacía.
      const publish = `«Publicar una camada» (${motion})`
      await settled(page, `${origin}${PUBLISH_LITTER}`)
      await makePhotos(page, 3)
      const litterName = page.getByRole('textbox', { name: 'Nombre de la camada' })
      const onPublish = await pickThree(page, await idOf(page.locator('input[type=file]').first()))
      await expectStillPreparing(publish, onPublish.ready, onPublish.before)
      await typeAtEnd(page, publish, litterName, 'el nombre de la camada', 'Kira')
      await typeAtEnd(
        page,
        publish,
        young(page, 'Cría 1').getByRole('textbox', { name: 'Nombre' }),
        'el nombre de una cría',
        'a',
      )
      await chooseSex(page, publish, young(page, 'Cría 2'), 'Macho')
      await tapAndExpect(
        page,
        `«Agregar cría» en ${publish}`,
        () => page.getByRole('button', { name: 'Agregar cría' }).click(),
        [{ selector: 'p', text: '3 de 10' }],
      )
      // La nueva toma el primer «Cría N» libre: «Cría 1», que dejó de serlo con la letra de antes.
      await tapAndExpect(
        page,
        `«Quitar cría» en ${publish}`,
        () => young(page, 'Cría 1').getByRole('button', { name: 'Quitar cría' }).click(),
        [{ selector: 'p', text: '2 de 10' }],
      )
      await chooseTap(
        page,
        `«Agregá fotos» de una cría en ${publish}`,
        addPhotos(young(page, 'Cría 2')),
      )
      await expect(preparing(page)).toHaveCount(onPublish.before + 3, { timeout: 60_000 })

      // Editar la camada de 10 crías.
      const litter = `editar la camada (${motion})`
      await settled(page, `${origin}${editLitterPath(editing.litter)}`)
      await makePhotos(page, 3)
      const fourth = young(page, 'Cría 4').locator('input[type=file]')
      const onLitter = await pickThree(page, await idOf(fourth))
      await expectStillPreparing(litter, onLitter.ready, onLitter.before)
      await typeAtEnd(
        page,
        litter,
        page.getByRole('textbox', { name: 'Nombre de la camada' }),
        'el nombre de la camada',
        ' y Kira',
      )
      await typeAtEnd(
        page,
        litter,
        young(page, 'Cría 5').getByRole('textbox', { name: 'Nombre' }),
        'el nombre de una cría',
        'b',
      )
      await chooseSex(page, litter, young(page, 'Cría 6'), 'Hembra')
      await tapAndExpect(
        page,
        `«Quitar cría» en ${litter}`,
        () => young(page, 'Cría 10').getByRole('button', { name: 'Quitar cría' }).click(),
        [{ selector: 'p', text: '9 de 10' }],
      )
      await tapAndExpect(
        page,
        `«Agregar cría» en ${litter}`,
        () => page.getByRole('button', { name: 'Agregar cría' }).click(),
        [{ selector: 'p', text: '10 de 10' }],
      )
      await chooseTap(
        page,
        `«Agregá fotos» de una cría en ${litter}`,
        addPhotos(young(page, 'Cría 7')),
      )
      // Las tres nuevas, menos la de Cría 10, que se fue con ella.
      await expect(preparing(page)).toHaveCount(onLitter.before + 2, { timeout: 60_000 })

      // Editar a Luna, con 5 fotos: se sacan tres para elegir otras tres.
      const luna = `editar a Luna (${motion})`
      await settled(page, `${origin}${editPetPath(editing.luna)}`)
      await makePhotos(page, 3)
      for (let index = 0; index < 3; index += 1) {
        // oxlint-disable-next-line no-await-in-loop -- una por vez, la última primero
        await page.getByRole('button', { name: 'Quitar foto' }).last().click()
      }
      await expect(preparing(page)).toHaveCount(2)
      await chooseTap(page, `«Agregá fotos» en ${luna}`, addPhotos(page))
      const onLuna = await pickThree(page, await idOf(page.locator('input[type=file]').first()))
      await expectStillPreparing(luna, onLuna.ready, onLuna.before)
      await typeAtEnd(page, luna, page.getByRole('textbox', { name: 'Nombre' }), 'el nombre', 'na')
      await typeAtEnd(
        page,
        luna,
        page.getByRole('textbox', { name: 'Descripción (opcional)' }),
        'la descripción',
        ' Mimosa.',
      )
      await chooseSex(page, luna, page.getByRole('group', { name: 'Sexo', exact: true }), 'Macho')
      await expect(preparing(page)).toHaveCount(5, { timeout: 60_000 })
    } finally {
      if (editing !== null) await removeRunOwner(editing.owner.id)
    }
  })
}

// La acción del servidor llega pero la respuesta se pierde (`lost`), o ni sale (`down`).
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

async function littersOf(ownerId: string): Promise<number> {
  const { count } = await service()
    .from('litters')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  return count ?? 0
}

async function descriptionOf(id: string): Promise<string> {
  const { data } = await service().from('pets').select('description').eq('id', id).single()
  return String(data?.description ?? '')
}

async function youngNames(litterId: string): Promise<string[]> {
  const { data } = await service().from('pets').select('name').eq('litter_id', litterId)
  return (data ?? []).map((one) => String(one.name))
}

function choose(page: Page, group: string, option: string) {
  return page
    .getByRole('group', { name: group, exact: true })
    .getByRole('radio', { name: option, exact: true })
    .check()
}

async function fillLitter(page: Page) {
  await page.getByRole('textbox', { name: 'Nombre de la camada' }).fill('La camada de Kira')
  await choose(page, 'Especie', 'Gato')
  await page.getByRole('textbox', { name: 'Edad aproximada, en números' }).fill('2')
  await choose(page, 'Unidad de la edad', 'Meses')
  await choose(page, 'Tamaño de adulto', 'Chico')
  await choose(page, 'Castrado', 'No')
  await choose(page, 'Vacunas', 'Al día')
  await choose(page, 'Chip', 'No')
  await young(page, 'Cría 1').getByRole('radio', { name: 'Hembra', exact: true }).check()
  await young(page, 'Cría 2').getByRole('radio', { name: 'Macho', exact: true }).check()
}

// Dos toques seguidos: el botón contesta trabajando en menos de 200 ms y la acción sale una vez.
async function doubleTap(page: Page, actions: SlowActions, screen: string, label: string) {
  actions.reset()
  await tapAndExpect(
    page,
    `«${label}» tocado dos veces en ${screen}`,
    () => page.getByRole('button', { name: label, exact: true }).dblclick(),
    [{ selector: 'button[aria-busy="true"]', text: label }],
  )
}

// Covers: criterio 3 de #338
test('«Publicar la camada» y «Guardar» contestan trabajando, guardan una vez y sin señal dejan todo como estaba', async ({
  page,
}) => {
  test.setTimeout(600_000)
  let editing: Editing | null = null
  try {
    editing = await editingRescuer()
    await signIn(page, editing.owner.email, '/mis-animales')
    await expect(page).toHaveURL(/mis-animales/)
    const origin = new URL(page.url()).origin
    const cut = await cutActions(page)
    const actions = await slowActions(page)
    await throttleLikeAPhone(page)

    // Editar a Luna: dos toques guardan una vez.
    await settled(page, `${origin}${editPetPath(editing.luna)}`)
    const description = page.getByRole('textbox', { name: 'Descripción (opcional)' })
    await description.fill('Mimosa y tranquila.')
    await doubleTap(page, actions, 'editar a Luna', 'Guardar')
    await expect(page).toHaveURL(SAVED, { timeout: 60_000 })
    expect(actions.count(), '«Guardar» tocado dos veces, acciones que salieron').toBe(1)
    expect(await descriptionOf(editing.luna)).toBe('Mimosa y tranquila.')

    // Sin señal: el aviso de siempre, lo escrito sigue y volver a tocar guarda.
    await settled(page, `${origin}${editPetPath(editing.luna)}`)
    await description.fill('Mimosa, tranquila y juguetona.')
    cut.set('lost')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page.getByText(/^No se guardó/u)).toBeVisible({ timeout: 60_000 })
    await expect(description).toHaveValue('Mimosa, tranquila y juguetona.')
    cut.set('up')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page).toHaveURL(SAVED, { timeout: 60_000 })
    expect(await descriptionOf(editing.luna)).toBe('Mimosa, tranquila y juguetona.')

    // Editar la camada: lo mismo con el nombre de una cría.
    await settled(page, `${origin}${editLitterPath(editing.litter)}`)
    const firstName = page.locator(
      `[id="${await idOf(young(page, 'Cría 1').getByRole('textbox', { name: 'Nombre' }))}"]`,
    )
    await firstName.fill('Tito')
    await doubleTap(page, actions, 'editar la camada', 'Guardar')
    await expect(page).toHaveURL(SAVED, { timeout: 60_000 })
    await expect.poll(() => youngNames(editing?.litter ?? '')).toContain('Tito')
    expect(actions.count(), '«Guardar» de la camada tocado dos veces, acciones que salieron').toBe(
      1,
    )
    await settled(page, `${origin}${editLitterPath(editing.litter)}`)
    const secondName = page.locator(
      `[id="${await idOf(young(page, 'Cría 2').getByRole('textbox', { name: 'Nombre' }))}"]`,
    )
    await secondName.fill('Pancho')
    cut.set('down')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page.getByText(/^No se guardó/u)).toBeVisible({ timeout: 60_000 })
    await expect(secondName).toHaveValue('Pancho')
    cut.set('up')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page).toHaveURL(SAVED, { timeout: 60_000 })
    await expect.poll(() => youngNames(editing?.litter ?? '')).toContain('Pancho')

    // «Publicar una camada»: con las fotos todavía preparándose, dos toques publican una sola.
    const before = await littersOf(editing.owner.id)
    await settled(page, `${origin}${PUBLISH_LITTER}`)
    await fillLitter(page)
    await makePhotos(page, 3)
    await pick(page, 0, 3)
    await doubleTap(page, actions, '«Publicar una camada»', 'Publicar la camada')
    await expect(page).toHaveURL(SAVED, { timeout: 120_000 })
    expect(await littersOf(editing.owner.id), 'camadas después de dos toques').toBe(before + 1)

    // Llega y la respuesta se pierde: el aviso, todo en pantalla, y el reintento no publica otra.
    await settled(page, `${origin}${PUBLISH_LITTER}`)
    await fillLitter(page)
    await page.getByRole('textbox', { name: 'Nombre de la camada' }).fill('La camada de Mora')
    await makePhotos(page, 1)
    await pick(page, 0, 1)
    await expect(preparing(page)).toHaveCount(1, { timeout: 60_000 })
    cut.set('lost')
    await page.getByRole('button', { name: 'Publicar la camada', exact: true }).click()
    await expect(page.getByText(/^No se publicó/u)).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('textbox', { name: 'Nombre de la camada' })).toHaveValue(
      'La camada de Mora',
    )
    await expect(preparing(page)).toHaveCount(1)
    cut.set('up')
    await page.getByRole('button', { name: 'Publicar la camada', exact: true }).click()
    await expect(page).toHaveURL(SAVED, { timeout: 120_000 })
    expect(await littersOf(editing.owner.id), 'camadas después del reintento').toBe(before + 2)
  } finally {
    if (editing !== null) await removeRunOwner(editing.owner.id)
  }
})

async function openMyPets(page: Page) {
  await page.getByRole('button', { name: /^Mi cuenta/u }).click()
  await page.getByRole('link', { name: 'Mis animales', exact: true }).click()
}

async function expectLeaving(page: Page, screen: string) {
  const dialog = page.getByRole('dialog', { name: LEAVING })
  await expect(dialog, `«${LEAVING}» en ${screen}`).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByRole('button', { name: 'Seguir editando' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Salir' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Seguir editando' }).click()
  await expect(dialog).toHaveCount(0)
  expect(new URL(page.url()).pathname).toContain('/editar')
}

// Covers: criterio 4 de #338
test('cambiar algo apenas abre y tocar «Mis animales» en el menú avisa «Tenés cambios sin guardar»', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let editing: Editing | null = null
  try {
    editing = await editingRescuer()
    await signIn(page, editing.owner.email, '/mis-animales')
    await expect(page).toHaveURL(/mis-animales/)
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    const layer = await cutLayer(page, OVERLAY_LAYER)

    // Apenas aparece el nombre de una cría, sin esperar a que termine de bajar lo demás.
    await page.goto(`${origin}${editLitterPath(editing.litter)}`, { waitUntil: 'commit' })
    const name = young(page, 'Cría 1').getByRole('textbox', { name: 'Nombre' })
    await expect(name).toBeVisible({ timeout: 30_000 })
    await name.press('End')
    await name.press('s')
    await openMyPets(page)
    await expectLeaving(page, 'editar la camada')

    // La capa del aviso todavía no llegó: aparece apenas llega.
    layer.set('hold')
    await page.goto(`${origin}${editPetPath(editing.luna)}`, { waitUntil: 'commit' })
    const description = page.getByRole('textbox', { name: 'Descripción (opcional)' })
    await expect(description).toBeVisible({ timeout: 30_000 })
    await description.fill('Mimosa.')
    await openMyPets(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await layer.release()
    await expectLeaving(page, 'editar a Luna')
  } finally {
    if (editing !== null) await removeRunOwner(editing.owner.id)
  }
})
