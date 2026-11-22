import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import { removeAvatar, uploadAvatar } from './support/avatar'
import { cutLayer, OVERLAY_LAYER, partFailedNotice } from './support/cut-layer'
import { firstSeen } from './support/first-seen'
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
import { settled, slowActions } from './support/slow-server'
import { expectAnswered, timeTap, type Answer } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #346: «Mi perfil», «Mis avales», «Mis avisos» y «Mis bloqueos» entran al presupuesto de
// las pantallas con sesión (docs/07 §Presupuesto de performance), con red y procesador de teléfono
// de gama media. El total de cada una en `main` antes de #346, en la versión que más baja, redondeado
// hacia arriba al décimo de KB: impide esconder peso de apertura corriéndolo a después de abrir.
// «Mis avales» llena baja la capa del diálogo de «Quitar el aval»; «Mis bloqueos» vacía, lo que pide
// «Volver a mi perfil».
const PROFILE_TOTAL_KB = 149.6
const VOUCHES_TOTAL_KB = 160.6
const ALERTS_TOTAL_KB = 142.3
const BLOCKS_TOTAL_KB = 144.2

const PROFILE = '/mi-perfil'
const VOUCHES = '/mis-avales'
const ALERTS = '/mis-avisos'
const BLOCKS = '/mis-bloqueos'
const MOTIONS = ['no-preference', 'reduce'] as const
const SEND_LINK = /^(Mandar|Copiar) el enlace$/
const COPIED: Answer = { selector: 'output', text: 'Enlace copiado' }
const REMOVE_FAILED =
  'No llegó: el sitio no respondió. Tocá «Quitar el aval» de nuevo; no se va a duplicar.'
const DELETE_FAILED = 'No pudimos borrar el aviso. Probá de nuevo.'
const DELETED = 'Borraste el aviso.'
// Solo está en el archivo que trae cómo se manda el enlace (`lib/share/share-mode.ts`).
const SHARE_MODULE = 'afterShareError'

// Las 50 personas sembradas que avalan a Eva, con nivel 2: avalan también a la persona de la prueba.
const AVALES = Array.from(
  { length: 50 },
  (_, index) => `99999999-9999-9999-9999-${String(index + 1).padStart(12, '0')}`,
)

type Heaviest = { person: Person; vouchees: Person[] }

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

// Lo más pesado que puede tener una persona de verdad: nivel 3 con foto, teléfono, identidad
// aprobada y 50 avales; 10 avales dados, 3 avisos, que es el máximo, y 10 personas bloqueadas.
async function heaviest(): Promise<Heaviest> {
  const person = await newPerson('Vera Prueba', { level: 2 })
  await uploadAvatar(person.id)
  const vouchees = await Promise.all(
    Array.from({ length: 10 }, (_, index) => newPerson(`Avalada ${index + 1}`, { level: 2 })),
  )
  const db = service()
  const received = await db.from('vouches').insert(
    AVALES.map((voucher, index) => ({
      voucher_id: voucher,
      vouchee_id: person.id,
      created_at: new Date(Date.now() - index * 86_400_000).toISOString(),
    })),
  )
  expect(received.error).toBeNull()
  const given = await db
    .from('vouches')
    .insert(vouchees.map((vouchee) => ({ voucher_id: person.id, vouchee_id: vouchee.id })))
  expect(given.error).toBeNull()
  const blocks = await db
    .from('blocks')
    .insert(AVALES.slice(40).map((blocked) => ({ blocker_id: person.id, blocked_id: blocked })))
  expect(blocks.error).toBeNull()
  const none = { species: [], sexes: [], sizes: [], age_bands: [], departments: [] }
  const alert = { ...none, user_id: person.id, neutered_only: false }
  const alerts = await db.from('pet_alerts').insert([
    { ...alert, species: ['cat'], departments: ['UY-RV'] },
    { ...alert, species: ['dog'], sizes: ['large'], age_bands: ['adult'] },
    { ...alert, sexes: ['female'], neutered_only: true, departments: ['UY-MO'] },
  ])
  expect(alerts.error).toBeNull()
  return { person, vouchees }
}

async function cleanUp(heavy: Heaviest | null): Promise<void> {
  if (heavy === null) return
  await removeAvatar(heavy.person.id)
  await Promise.all([heavy.person, ...heavy.vouchees].map(removePerson))
}

async function count(table: string, column: string, id: string): Promise<number> {
  const { count: rows, error } = await service()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, id)
  expect(error).toBeNull()
  return rows ?? 0
}

// Lo que tiene que verse antes de los 2,5 s, en una pestaña aparte con la misma sesión: cada
// medición deja su script en la pestaña que la hace.
async function expectSeenWithin(page: Page, path: string, screen: string, texts: string[]) {
  const tab = await page.context().newPage()
  try {
    await throttleLikeAPhone(tab)
    const seen = await firstSeen(tab, path, texts)
    texts.forEach((text, index) => {
      test.info().annotations.push({
        type: 'rendimiento',
        description: `${screen}, «${text}» a la vista: ${Math.round(seen[index])} ms`,
      })
      expect(seen[index], `«${text}» en ${screen}, en ms`).toBeLessThan(LCP_MS)
    })
  } finally {
    await tab.close()
  }
}

// La foto y el nivel llegan en el HTML del servidor, con el nombre: se ven en el mismo cuadro que él.
async function expectInServerHtml(page: Page, path: string, parts: string[]) {
  const html = await (await page.request.get(path)).text()
  for (const part of parts) expect(html.includes(part), `${part} en el HTML de ${path}`).toBe(true)
}

// Covers: criterios 1, 2 y 5 de #346
test('«Mi perfil», «Mis avales», «Mis avisos» y «Mis bloqueos» abren dentro de los 150 KB, llenas y vacías', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let heavy: Heaviest | null = null
  const fresh = await newPerson('Nico Prueba', { level: 0 })
  try {
    heavy = await heaviest()
    await signIn(page, heavy.person.email, PROFILE)
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await expect(page.getByRole('link', { name: /^Verificado, nivel 3/ })).toBeVisible()
    await throttleLikeAPhone(page)
    await withoutCache(page)

    expectWithin(
      '«Mi perfil» de nivel 3',
      await measure(page, `${origin}${PROFILE}`),
      PROFILE_TOTAL_KB,
    )
    await expectInServerHtml(page, `${origin}${PROFILE}`, [
      'alt="Tu foto de perfil"',
      'aria-label="Verificado, nivel 3. Qué significa"',
    ])
    expectWithin(
      '«Mis avales» con 60 avales',
      await measure(page, `${origin}${VOUCHES}`),
      VOUCHES_TOTAL_KB,
    )
    await expect(page.getByRole('button', { name: 'Quitar el aval' })).toHaveCount(50)
    expectWithin(
      '«Mis avisos» con 3 avisos',
      await measure(page, `${origin}${ALERTS}`),
      ALERTS_TOTAL_KB,
    )
    await expect(page.getByRole('button', { name: 'Borrar', exact: true })).toHaveCount(3)
    expectWithin(
      '«Mis bloqueos» con 10 personas',
      await measure(page, `${origin}${BLOCKS}`),
      BLOCKS_TOTAL_KB,
    )
    await expect(page.getByRole('button', { name: 'Desbloquear' })).toHaveCount(10)

    await expectSeenWithin(page, `${origin}${PROFILE}`, '«Mi perfil» de nivel 3', ['Vera Prueba'])
    await expectSeenWithin(page, `${origin}${VOUCHES}`, '«Mis avales» con 60 avales', [
      'Mis avales',
      'Quitar el aval',
    ])
    await expectSeenWithin(page, `${origin}${ALERTS}`, '«Mis avisos» con 3 avisos', [
      'Mis avisos',
      'Ver en el listado',
    ])
    await expectSeenWithin(page, `${origin}${BLOCKS}`, '«Mis bloqueos» con 10 personas', [
      'Mis bloqueos',
      'Desbloquear',
    ])

    await page.context().clearCookies()
    await signIn(page, fresh.email, PROFILE)
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
    expectWithin(
      '«Mi perfil» recién creada',
      await measure(page, `${origin}${PROFILE}`),
      PROFILE_TOTAL_KB,
    )
    expectWithin(
      '«Mis avales» sin avales',
      await measure(page, `${origin}${VOUCHES}`),
      VOUCHES_TOTAL_KB,
    )
    expectWithin(
      '«Mis avisos» sin avisos',
      await measure(page, `${origin}${ALERTS}`),
      ALERTS_TOTAL_KB,
    )
    await expect(page.getByRole('link', { name: 'Ver animales en adopción' })).toBeVisible()
    expectWithin(
      '«Mis bloqueos» sin bloqueos',
      await measure(page, `${origin}${BLOCKS}`),
      BLOCKS_TOTAL_KB,
    )
    await expect(page.getByText('No bloqueaste a nadie.', { exact: false })).toBeVisible()
    await expectSeenWithin(page, `${origin}${PROFILE}`, '«Mi perfil» recién creada', [
      'Nico Prueba',
      'Verificar mi teléfono',
    ])
  } finally {
    await cleanUp(heavy)
    await removePerson(fresh)
  }
})

async function doubleTap(
  page: Page,
  name: string,
  button: ReturnType<Page['getByRole']>,
  label: string,
) {
  await expect(button).toBeEnabled()
  const ms = await timeTap(page, name, () => button.dblclick(), [
    { selector: 'button[aria-busy="true"]', text: label },
  ])
  expectAnswered(name, ms)
}

for (const motion of MOTIONS) {
  // Covers: criterios 3 y 4 de #346
  test(`cada toque de las cuatro pantallas contesta en menos de 200 ms con el sitio tardando 3 s, una sola vez (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(300_000)
    let heavy: Heaviest | null = null
    try {
      heavy = await heaviest()
      const { person } = heavy
      await page.emulateMedia({ reducedMotion: motion })
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      await signIn(page, person.email, PROFILE)
      await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
      const origin = new URL(page.url()).origin
      await throttleLikeAPhone(page)
      const actions = await slowActions(page)

      await settled(page, `${origin}${PROFILE}`)
      const send = page.getByRole('button', { name: SEND_LINK })
      const sent = `«Mandar el enlace» en «Mi perfil» (${motion})`
      expectAnswered(sent, await timeTap(page, sent, () => send.click(), [COPIED]))
      const remove = `«Borrar mi cuenta» (${motion})`
      expectAnswered(
        remove,
        await timeTap(
          page,
          remove,
          () => page.getByRole('button', { name: 'Borrar mi cuenta' }).click(),
          // La pregunta baja recién al tocar (#326): contesta el botón trabajando o la pregunta.
          [{ selector: 'button[aria-busy="true"], [role="dialog"]', text: 'Borrar mi cuenta' }],
        ),
      )
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)

      await settled(page, `${origin}${VOUCHES}`)
      const unvouch = `«Quitar el aval» en «Mis avales» (${motion})`
      expectAnswered(
        unvouch,
        await timeTap(
          page,
          unvouch,
          () => page.getByRole('button', { name: 'Quitar el aval' }).first().click(),
          [{ selector: '[role="dialog"]', text: 'Quitar el aval de' }],
        ),
      )
      actions.reset()
      await doubleTap(
        page,
        `«Quitar el aval» confirmado dos veces (${motion})`,
        page.getByRole('dialog').getByRole('button', { name: 'Quitar el aval' }),
        'Quitar el aval',
      )
      await expect(page.getByRole('button', { name: 'Quitar el aval' })).toHaveCount(49, {
        timeout: 30_000,
      })
      expect(actions.count(), '«Quitar el aval» confirmado dos veces, pedidos que salieron').toBe(1)
      expect(await count('vouch_blocks', 'vouchee_id', person.id), 'avales quitados').toBe(1)

      await settled(page, `${origin}${ALERTS}`)
      actions.reset()
      await doubleTap(
        page,
        `«Borrar» en «Mis avisos» tocado dos veces (${motion})`,
        page.getByRole('button', { name: 'Borrar', exact: true }).first(),
        'Borrar',
      )
      await expect(page.getByText(DELETED).first()).toBeVisible({ timeout: 30_000 })
      expect(actions.count(), '«Borrar» tocado dos veces, pedidos que salieron').toBe(1)
      expect(await count('pet_alerts', 'user_id', person.id), 'avisos que quedan').toBe(2)

      await settled(page, `${origin}${BLOCKS}`)
      actions.reset()
      await doubleTap(
        page,
        `«Desbloquear» en «Mis bloqueos» tocado dos veces (${motion})`,
        page.getByRole('button', { name: 'Desbloquear' }).first(),
        'Desbloquear',
      )
      await expect(page.getByRole('button', { name: 'Desbloquear' })).toHaveCount(9, {
        timeout: 30_000,
      })
      expect(actions.count(), '«Desbloquear» tocado dos veces, pedidos que salieron').toBe(1)

      await settled(page, `${origin}${PROFILE}`)
      actions.reset()
      await doubleTap(
        page,
        `«Cerrar sesión» tocado dos veces (${motion})`,
        page.getByRole('button', { name: 'Cerrar sesión' }),
        'Cerrar sesión',
      )
      await expect(page).not.toHaveURL(/mi-perfil/, { timeout: 30_000 })
      expect(actions.count(), '«Cerrar sesión» tocado dos veces, pedidos que salieron').toBe(1)
    } finally {
      await cleanUp(heavy)
    }
  })
}

// La acción llega a la base y la respuesta se pierde (`lost`), o ni sale (`down`).
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

// Covers: criterio 4 de #346
test('sin señal, quitar un aval y borrar un aviso dejan la fila y el reintento lo hace una sola vez', async ({
  page,
}) => {
  test.setTimeout(300_000)
  let heavy: Heaviest | null = null
  try {
    heavy = await heaviest()
    const { person } = heavy
    await signIn(page, person.email, VOUCHES)
    await expect(page.getByRole('button', { name: 'Quitar el aval' }).first()).toBeVisible()
    const origin = new URL(page.url()).origin
    const cut = await cutActions(page)

    await settled(page, `${origin}${VOUCHES}`)
    await page.getByRole('button', { name: 'Quitar el aval' }).first().click()
    const confirm = page.getByRole('dialog').getByRole('button', { name: 'Quitar el aval' })
    cut.set('lost')
    await confirm.click()
    await expect(page.getByRole('dialog').getByText(REMOVE_FAILED)).toBeVisible({ timeout: 30_000 })
    cut.set('up')
    await confirm.click()
    await expect(page.getByRole('button', { name: 'Quitar el aval' })).toHaveCount(49, {
      timeout: 30_000,
    })
    expect(await count('vouch_blocks', 'vouchee_id', person.id), 'avales quitados').toBe(1)
    expect(await count('vouches', 'vouchee_id', person.id), 'avales que quedan').toBe(49)

    await settled(page, `${origin}${ALERTS}`)
    const first = page.getByRole('button', { name: 'Borrar', exact: true }).first()
    for (const mode of ['down', 'lost'] as const) {
      cut.set(mode)
      // oxlint-disable-next-line no-await-in-loop -- un corte por vez
      await first.click()
      // oxlint-disable-next-line no-await-in-loop -- un corte por vez
      await expect(page.getByText(DELETE_FAILED)).toBeVisible({ timeout: 30_000 })
      // oxlint-disable-next-line no-await-in-loop -- un corte por vez
      await expect(page.getByRole('button', { name: 'Borrar', exact: true })).toHaveCount(3)
    }
    cut.set('up')
    await first.click()
    await expect(page.getByText(DELETED).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Borrar', exact: true })).toHaveCount(2)
    expect(await count('pet_alerts', 'user_id', person.id), 'avisos que quedan').toBe(2)
  } finally {
    await cleanUp(heavy)
  }
})

type Waiting = {
  marker: string
  what: string
  button: string | RegExp
  arrived: (tab: Page) => Locator
}

// En una pestaña aparte con la misma sesión: cada corte intercepta todos los archivos de su pestaña.
// Con lo que el toque pide colgado, el botón trabaja y lo abre apenas llega; sin llegar, a los 10 s
// deja «Reintentar», que lo vuelve a pedir.
async function expectWaitsThenRetries(page: Page, path: string, waiting: Waiting) {
  const tab = await page.context().newPage()
  try {
    await throttleLikeAPhone(tab)
    const cut = await cutLayer(tab, waiting.marker)
    const button = tab.getByRole('button', { name: waiting.button })
    cut.set('hold')
    await tab.goto(path, { waitUntil: 'load' })
    expectAnswered(
      waiting.what,
      await timeTap(tab, waiting.what, () => button.click(), [
        { selector: 'button[aria-busy="true"]' },
      ]),
    )
    await cut.release()
    await expect(waiting.arrived(tab)).toBeVisible({ timeout: 30_000 })

    cut.set('down')
    await tab.goto(path, { waitUntil: 'load' })
    await button.click()
    await expect(partFailedNotice(tab)).toBeVisible({ timeout: 20_000 })
    await expect(waiting.arrived(tab)).toHaveCount(0)
    cut.set('up')
    await tab.getByRole('button', { name: 'Reintentar' }).click()
    await expect(waiting.arrived(tab)).toBeVisible({ timeout: 30_000 })
  } finally {
    await tab.close()
  }
}

// Covers: criterio 4 de #346 (lo que todavía no bajó, como en #318)
test('lo que se toca antes de que baje trabaja mientras llega y, si no llega, deja «Reintentar»', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const person = await newPerson('Iris Prueba', { level: 2 })
  const voucher = await newPerson('Olga Prueba', { level: 2 })
  try {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await signIn(page, person.email, VOUCHES)
    await expect(page.getByRole('heading', { name: 'Mis avales' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await slowActions(page)

    // Covers: criterio 3 de #346. «Mis avales» sin avales ofrece el enlace para pedirlos.
    await settled(page, `${origin}${VOUCHES}`)
    const ask = '«Mandar el enlace» en «Mis avales» sin avales'
    expectAnswered(
      ask,
      await timeTap(page, ask, () => page.getByRole('button', { name: SEND_LINK }).click(), [
        COPIED,
      ]),
    )

    const vouch = await service()
      .from('vouches')
      .insert({ voucher_id: voucher.id, vouchee_id: person.id })
    expect(vouch.error).toBeNull()

    const layer = await cutLayer(page, OVERLAY_LAYER)
    layer.set('hold')
    await page.goto(`${origin}${VOUCHES}`, { waitUntil: 'load' })
    const unvouch = page.getByRole('button', { name: 'Quitar el aval' })
    const waiting = '«Quitar el aval» antes de que llegue su pregunta'
    expectAnswered(
      waiting,
      await timeTap(page, waiting, () => unvouch.click(), [
        { selector: 'button[aria-busy="true"]', text: 'Quitar el aval' },
      ]),
    )
    await layer.release()
    await expect(page.getByRole('dialog', { name: 'Quitar el aval de Olga Prueba' })).toBeVisible({
      timeout: 30_000,
    })

    layer.set('down')
    await page.goto(`${origin}${VOUCHES}`, { waitUntil: 'load' })
    await unvouch.click()
    await expect(partFailedNotice(page)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    layer.set('up')
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await expect(page.getByRole('dialog', { name: 'Quitar el aval de Olga Prueba' })).toBeVisible({
      timeout: 30_000,
    })

    await expectWaitsThenRetries(page, `${origin}${PROFILE}`, {
      marker: OVERLAY_LAYER,
      what: '«Borrar mi cuenta» antes de que llegue su pregunta',
      button: 'Borrar mi cuenta',
      arrived: (tab) => tab.getByRole('dialog', { name: '¿Borrar tu cuenta?' }),
    })
    await expectWaitsThenRetries(page, `${origin}${PROFILE}`, {
      marker: SHARE_MODULE,
      what: '«Mandar el enlace» antes de que llegue cómo se manda',
      button: SEND_LINK,
      arrived: (tab) => tab.locator('output', { hasText: 'Enlace copiado' }),
    })
  } finally {
    await removePerson(person)
    await removePerson(voucher)
  }
})
