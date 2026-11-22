import { createHash, randomBytes } from 'node:crypto'
import { expect, test, type Page, type Route } from '@playwright/test'
import { URUGUAY_TIME_ZONE } from '../../src/lib/verification/rules'
import { publishForRun, publishLitterForRun, removeRunOwner } from './support/listed-pets'
import { withoutCache } from './support/opening-weight'
import { service, signIn } from './support/pet-owner'
import { expectOpenWithin, expectTotalWithin, expectVitals, measure } from './support/screen-budget'
import { settled } from './support/slow-server'
import {
  armTapAcrossPages,
  expectAnswered,
  readTapAcrossPages,
  timeTap,
  type Answer,
} from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #354: tocar «Sigue disponible» en el correo muestra el resultado en menos de 2,5 s con red
// y procesador de teléfono, contando la renovación, que pasa antes de que llegue la pantalla; la
// pantalla abre con 150 KB o menos y sin correrse; y cada botón de esa pantalla contesta en menos de
// 200 ms aunque el sitio tarde 3 s, sin renovar dos veces con dos toques.
// El total de `main` antes de #354, redondeado hacia arriba al décimo de KB: impide esconder peso de
// apertura corriéndolo a después de abrir.
const TOTAL_KB = 154.8

const DAY_MS = 86_400_000
const SLOW_MS = 3_000
const MOTIONS = ['no-preference', 'reduce'] as const
const LITTER = 'La camada de Luna'
// Lo primero que se ve al soltar un enlace dentro del sitio: el enlace apagado, o la espera de la
// pantalla que abre si ya estaba traída.
const OPENING: Answer[] = [{ selector: 'a:has(> [data-opening]), .shimmer' }]

test.use({ viewport: { width: 390, height: 844 } })

type Link = { token: string; path: string }

function newLink(): Link {
  const token = randomBytes(32).toString('base64url')
  return { token, path: `/sigue-disponible/${token}` }
}

const hashed = (token: string) => createHash('sha256').update(token).digest('hex')

async function petLink(petId: string): Promise<Link> {
  const link = newLink()
  const created = await service().rpc('create_pet_renewal_link', {
    p_pet: petId,
    p_token_hash: hashed(link.token),
  })
  expect(created.error).toBeNull()
  return link
}

async function litterLink(litterId: string): Promise<Link> {
  const link = newLink()
  const created = await service().rpc('create_litter_renewal_link', {
    p_litter: litterId,
    p_token_hash: hashed(link.token),
  })
  expect(created.error).toBeNull()
  return link
}

async function expiresIn(table: 'pets' | 'litters', id: string, days: number) {
  const moved = await service()
    .from(table)
    .update({ expires_at: new Date(Date.now() + days * DAY_MS).toISOString() })
    .eq('id', id)
  expect(moved.error).toBeNull()
}

async function soloPet(ownerId: string): Promise<string> {
  const { data, error } = await service()
    .from('pets')
    .select('id')
    .eq('owner_id', ownerId)
    .is('litter_id', null)
    .single()
  expect(error).toBeNull()
  return data?.id ?? ''
}

async function expiryOf(table: 'pets' | 'litters', id: string): Promise<Date> {
  const { data } = await service().from(table).select('expires_at').eq('id', id).single()
  return new Date(data?.expires_at ?? 0)
}

const day = (date: Date) =>
  new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    timeZone: URUGUAY_TIME_ZONE,
  }).format(date)

// El sitio tarda 3 s en contestar el toque a «Sigue disponible» (la ruta que renueva) y cada pantalla
// pedida desde adentro. Devuelve cuántas veces se pidió la ruta que renueva: cada pedido renueva y se
// cuenta una vez. `release` contesta ya lo que está esperando: medido el toque, los 3 s que faltan
// solo alargarían la corrida, que en CI ya roza su tope de tiempo.
async function slowSite(
  page: Page,
  link: Link,
): Promise<{ renewals: () => number; release: () => void }> {
  let renewals = 0
  const waiting = new Set<() => void>()
  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const headers = request.headers()
    const isInSite = headers.rsc !== undefined && headers['next-router-prefetch'] === undefined
    const isRenewal = new URL(request.url()).pathname === link.path
    if (isRenewal && request.isNavigationRequest()) renewals += 1
    if (request.method() === 'GET' && (isInSite || isRenewal)) {
      await new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(timer)
          waiting.delete(done)
          resolve()
        }
        const timer = setTimeout(done, SLOW_MS)
        waiting.add(done)
      })
    }
    await route.fallback()
  })
  return {
    renewals: () => renewals,
    release: () => {
      for (const done of [...waiting]) done()
    },
  }
}

const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 1, name, exact: true })

// Covers: criterios 1 y 5 de #354
test('del toque en el correo al resultado pasan menos de 2,5 s, con 150 KB y sin correrse', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const { owner } = await publishForRun([{ name: 'Luna', species: 'dog', sex: 'female' }])
  try {
    const luna = await soloPet(owner.id)
    const litter = await publishLitterForRun(owner.id, 2)
    await expiresIn('pets', luna, 7)
    await expiresIn('litters', litter.id, 7)
    const renewing = await petLink(luna)
    const litterRenewing = await litterLink(litter.id)

    await throttleLikeAPhone(page)
    await withoutCache(page)

    const renewed = await measure(page, renewing.path)
    await expect(page).toHaveURL(/\/listo\?r=renewed$/)
    const lunaUntil = await expiryOf('pets', luna)
    expect(lunaUntil.getTime() - Date.now()).toBeGreaterThan(29 * DAY_MS)
    await expect(heading(page, `Luna sigue publicada hasta el ${day(lunaUntil)}`)).toBeVisible()
    expectVitals('«Luna sigue publicada»', renewed)
    expectOpenWithin('«Luna sigue publicada»', renewed)
    expectTotalWithin('«Luna sigue publicada»', renewed, TOTAL_KB)

    const litterRenewed = await measure(page, litterRenewing.path)
    await expect(page).toHaveURL(/\/listo\?r=renewed$/)
    const litterUntil = await expiryOf('litters', litter.id)
    expect(litterUntil.getTime() - Date.now()).toBeGreaterThan(29 * DAY_MS)
    await expect(
      heading(page, `${LITTER} sigue publicada hasta el ${day(litterUntil)}`),
    ).toBeVisible()
    expectVitals(`«${LITTER} sigue publicada»`, litterRenewed)
    expectOpenWithin(`«${LITTER} sigue publicada»`, litterRenewed)
    expectTotalWithin(`«${LITTER} sigue publicada»`, litterRenewed, TOTAL_KB)

    await expiresIn('pets', luna, -1)
    const expired = await petLink(luna)
    const republished = await measure(page, expired.path)
    await expect(page).toHaveURL(/\/listo\?r=republished$/)
    await expect(heading(page, 'Luna volvió a Animales en adopción')).toBeVisible()
    expectVitals('«Luna volvió a Animales en adopción»', republished)
    expectOpenWithin('«Luna volvió a Animales en adopción»', republished)
    expectTotalWithin('«Luna volvió a Animales en adopción»', republished, TOTAL_KB)
  } finally {
    await removeRunOwner(owner.id)
  }
})

// «Reintentar» y «Sigue disponible» vuelven a pedir la ruta que renueva como página entera. Tocados
// tres veces seguidas, contestan al primero y renuevan una sola vez.
async function tapRenewing(
  page: Page,
  link: Link,
  screen: { path: string; title: string; action: string },
  name: string,
) {
  const site = await slowSite(page, link)
  await settled(page, screen.path)
  await expect(heading(page, screen.title)).toBeVisible()
  await armTapAcrossPages(page)
  await page
    .getByRole('link', { name: screen.action, exact: true })
    .click({ clickCount: 3, noWaitAfter: true })
  await expect(page).toHaveURL(/\/listo\?r=renewed$/, { timeout: 30_000 })
  await expect(
    page.getByRole('heading', { level: 1, name: /^Luna sigue publicada hasta el / }),
  ).toBeVisible()
  expectAnswered(name, await readTapAcrossPages(page, name))
  expect(site.renewals(), `${name}, veces que se renovó`).toBe(1)
  await page.unrouteAll({ behavior: 'wait' })
}

// «Ir a Mis animales» y «Confirmar mi teléfono» abren dentro del sitio: tocados dos veces contestan
// al primero, quedan apagados y piden la pantalla una vez.
async function tapOpening(
  page: Page,
  link: Link,
  screen: { path: string; action: string; arrives: RegExp },
  name: string,
) {
  const site = await slowSite(page, link)
  await settled(page, screen.path)
  const action = page.getByRole('link', { name: screen.action, exact: true })
  expectAnswered(name, await timeTap(page, name, () => action.dblclick(), OPENING))
  site.release()
  await expect(page).toHaveURL(screen.arrives, { timeout: 30_000 })
  await page.unrouteAll({ behavior: 'wait' })
}

for (const motion of MOTIONS) {
  // Covers: criterios 2, 3, 4 y 5 de #354
  test(`cada botón del resultado contesta en menos de 200 ms y renueva una vez (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(300_000)
    const { owner } = await publishForRun([{ name: 'Luna', species: 'dog', sex: 'female' }])
    try {
      const luna = await soloPet(owner.id)
      await expiresIn('pets', luna, 7)
      const link = await petLink(luna)
      const result = (r: string) => `${link.path}/listo?r=${r}`
      await page.emulateMedia({ reducedMotion: motion })
      await throttleLikeAPhone(page)

      await tapRenewing(
        page,
        link,
        { path: result('error'), title: 'No pudimos renovar a Luna', action: 'Reintentar' },
        `«Reintentar» tocado tres veces (${motion})`,
      )
      await tapRenewing(
        page,
        link,
        { path: result('preview'), title: '¿Luna sigue disponible?', action: 'Sigue disponible' },
        `«Sigue disponible» de la vista previa tocado tres veces (${motion})`,
      )

      for (const [r, action] of [
        ['renewed', 'Ir a Mis animales'],
        ['needs_verification', 'Confirmar mi teléfono'],
      ] as const) {
        // oxlint-disable-next-line no-await-in-loop -- un toque por vez, en la misma pestaña
        await tapOpening(
          page,
          link,
          { path: result(r), action, arrives: /\/entrar/ },
          `«${action}» sin sesión (${motion})`,
        )
      }

      await signIn(page, owner.email, '/mis-animales')
      await expect(page).toHaveURL(/\/mis-animales$/)
      await tapOpening(
        page,
        link,
        { path: result('renewed'), action: 'Ir a Mis animales', arrives: /\/mis-animales$/ },
        `«Ir a Mis animales» con sesión (${motion})`,
      )
      await tapOpening(
        page,
        link,
        {
          path: result('needs_verification'),
          action: 'Confirmar mi teléfono',
          arrives: /\/(verificar-telefono|mis-animales)/,
        },
        `«Confirmar mi teléfono» con sesión (${motion})`,
      )
    } finally {
      await removeRunOwner(owner.id)
    }
  })
}
