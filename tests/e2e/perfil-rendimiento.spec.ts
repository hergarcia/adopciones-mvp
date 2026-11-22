import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'
import { acceptApplication, sendApplication } from './support/applications'
import {
  publishForRun,
  publishLitterForRun,
  removeRunOwner,
  type RunPet,
} from './support/listed-pets'
import { scriptWeight, withoutCache } from './support/opening-weight'
import { newPerson, removePerson, type Person } from './support/people'
import { service, signIn } from './support/pet-owner'
import {
  CLS,
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  LCP_MS,
  measure,
  type Measured,
} from './support/screen-budget'
import { settled } from './support/slow-server'
import { expectAnswered, timeTap } from './support/tap-latency'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// SC-006 y el presupuesto de docs/07: el perfil más pesado del seed —Eva, con 50 avales—, sin sesión,
// en un teléfono de 390 px con red y CPU de gama media. Los umbrales son los del presupuesto, sin
// margen: si no se sostienen, es un hallazgo de rendimiento, no un test para aflojar.
const EVA = '/perfil/SemillaEva000000000008'
const JS_BYTES = 150 * 1024

// Historia #332: el perfil de una rescatista en su versión más pesada de verdad, como abre desde el
// enlace del grupo. El total de `main` antes de #332 (152.733 bytes, sin sesión y con la de otra
// persona), redondeado hacia arriba al décimo de KB, impide esconder peso de apertura corriéndolo a
// después de abrir.
const PROFILE_TOTAL_KB = 149.2
const LISTED = 29
const SLOW_PHOTO_MS = 3_000
const PET_PHOTOS = '**/fotos/pet-photos/**'
const PROFILE_PETS_API = '**/api/perfil/*/animales**'
const LISTING_API = '**/api/animales?**'
const MORE = 'Ver más'
const MORE_OFFLINE = 'No hay conexión. Tocá «Ver más» de nuevo.'
const AVALES = Array.from(
  { length: 50 },
  (_, index) => `99999999-9999-9999-9999-${String(index + 1).padStart(12, '0')}`,
)

test.use({ viewport: { width: 390, height: 844 } })

type Rescuer = {
  owner: { id: string; email: string }
  publicId: string
  adopter: Person
  /** Los nombres a la vista, del más nuevo al más viejo, como los ordena el perfil. */
  names: string[]
}

function pets(count: number): RunPet[] {
  const tag = Math.random().toString(36).slice(2, 7)
  return Array.from({ length: count }, (_, index) => ({
    name: `${tag} ${index + 1}`,
    species: index % 3 === 0 ? ('cat' as const) : ('dog' as const),
  }))
}

async function uploadAvatar(ownerId: string): Promise<void> {
  const avatar = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 3,
      background: { r: 200, g: 140, b: 90 },
      noise: { type: 'gaussian', mean: 128, sigma: 10 },
    },
  })
    .webp({ quality: 80 })
    .toBuffer()
  const db = service()
  const upload = await db.storage
    .from('avatars')
    .upload(`${ownerId}/avatar.webp`, avatar, { contentType: 'image/webp', upsert: true })
  expect(upload.error).toBeNull()
  const profile = await db
    .from('profiles')
    .update({ avatar_path: `${ownerId}/avatar.webp`, is_rescuer: true })
    .eq('id', ownerId)
  expect(profile.error).toBeNull()
}

// Dada con seguimiento respondido: la adopción con la base, como la marca el sitio, y la respuesta
// escrita directo, sin esperar los 30 días.
async function adoptedWithFollowUp(ownerId: string, adopterId: string, code: string) {
  const db = service()
  const { data: pet } = await db.from('pets').select('id').eq('code', code).single()
  const application = await sendApplication(adopterId, code)
  await acceptApplication(ownerId, application)
  const marked = await db.rpc('mark_pet_adopted', {
    p_owner: ownerId,
    p_pet: pet?.id,
    p_attempt: crypto.randomUUID(),
    p_application: application,
  })
  expect(marked.error).toBeNull()
  const { data: adoption } = await db.from('adoptions').select('id').eq('pet_id', pet?.id).single()
  const followUp = await db.from('follow_ups').upsert(
    {
      adoption_id: adoption?.id,
      adopter_id: adopterId,
      status: 'answered',
      answered_at: new Date().toISOString(),
    },
    { onConflict: 'adoption_id' },
  )
  expect(followUp.error).toBeNull()
}

// Con foto, 29 animales y una camada a la vista (30 cards: «Ver más» suma 6), 50 avales de las
// personas sembradas que avalan a Eva, la identidad verificada y 2 adopciones con seguimiento.
async function heaviestRescuer(): Promise<Rescuer> {
  const { owner, pets: published } = await publishForRun(pets(LISTED + 2), {
    photo: { grain: true },
  })
  await publishLitterForRun(owner.id, 3, { photo: { grain: true } })
  const adopter = await newPerson('Dani Prueba', { level: 1 })
  const db = service()
  await uploadAvatar(owner.id)
  const identity = await db
    .from('identity_verifications')
    .insert({ user_id: owner.id, verified_on: '2026-08-14' })
  expect(identity.error).toBeNull()
  const vouches = await db.from('vouches').insert(
    AVALES.map((voucher, index) => ({
      voucher_id: voucher,
      vouchee_id: owner.id,
      created_at: new Date(Date.now() - index * 86_400_000).toISOString(),
    })),
  )
  expect(vouches.error).toBeNull()
  for (const pet of published.slice(0, 2)) {
    // oxlint-disable-next-line no-await-in-loop -- una solicitud por vez, como las manda el sitio
    await adoptedWithFollowUp(owner.id, adopter.id, pet.code)
  }
  const { data } = await db.from('profiles').select('public_id').eq('id', owner.id).single()
  const names = published
    .slice(2)
    .map((pet) => pet.name)
    .reverse()
  return { owner, publicId: String(data?.public_id ?? ''), adopter, names }
}

async function cleanUp(rescuer: Rescuer | null): Promise<void> {
  if (rescuer === null) return
  await service()
    .storage.from('avatars')
    .remove([`${rescuer.owner.id}/avatar.webp`])
  await removePerson(rescuer.adopter)
  await removeRunOwner(rescuer.owner.id)
}

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

const wall = (page: Page) => page.locator('li[id^="a-"]')

async function cardHrefs(page: Page): Promise<string[]> {
  return wall(page)
    .locator('a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
}

// Dónde está una card en la página, no en la pantalla: si se corre, cambia aunque nadie scrollee.
async function topOf(page: Page, n: number): Promise<number> {
  return page
    .locator(`#a-${n}`)
    .evaluate((card) => card.getBoundingClientRect().top + window.scrollY)
}

// Cuántas cards hay después de «Ver más»: en el perfil, las 30 de la rescatista; en el listado, de 1 a
// 24 más, según lo que hayan publicado las otras pruebas que corren a la vez.
async function expectAdded(page: Page, before: number, after: number | null) {
  if (after !== null) {
    await expect(wall(page)).toHaveCount(after, { timeout: 30_000 })
    return
  }
  await expect(page.locator(`#a-${before + 1}`)).toBeAttached({ timeout: 30_000 })
  expect(await wall(page).count()).toBeLessThanOrEqual(before * 2)
}

// Toca «Ver más» con red y CPU de teléfono: el botón contesta trabajando en menos de 200 ms, los que
// siguen aparecen debajo sin mover los de antes, y el primero nuevo queda a la vista.
async function tapMore(page: Page, screen: string, before: number, after: number | null) {
  const button = page.getByRole('button', { name: MORE, exact: true })
  await button.scrollIntoViewIfNeeded()
  const last = await topOf(page, before)
  const name = `«Ver más» en ${screen}`
  const ms = await timeTap(page, name, () => button.click(), [
    { selector: 'button[aria-busy="true"]', text: MORE },
  ])
  await expectAdded(page, before, after)
  expectAnswered(name, ms)
  expect(await topOf(page, before), `la última card de antes en ${screen}, en px`).toBe(last)
  await expect(page.locator(`#a-${before + 1}`)).toBeInViewport()
}

// Cuándo terminó de llegar la foto de cada card de la primera fila, en ms desde que empezó a abrir.
async function firstRowPhotosAt(page: Page): Promise<number[]> {
  return page.locator('#a-1 img, #a-2 img').evaluateAll((images) =>
    images.map((image) => {
      const source = image instanceof HTMLImageElement ? image.currentSrc : ''
      const [entry] = performance.getEntriesByName(source)
      return entry instanceof PerformanceResourceTiming
        ? entry.responseEnd
        : Number.POSITIVE_INFINITY
    }),
  )
}

// Dos toques seguidos suman una sola vez; sin señal queda el aviso de siempre al pie, con las de
// antes en su lugar, y volver a tocar pide los mismos. Cada parte abre la pantalla desde su dirección
// sin `mostrar`: «Ver más» la deja en la dirección, y recargar traería todo lo ya sumado.
async function tapMoreTwiceAndOffline(
  page: Page,
  { path, api }: { path: string; api: string },
  before: number,
  after: number | null,
) {
  await settled(page, path)
  const button = page.getByRole('button', { name: MORE, exact: true })
  await button.scrollIntoViewIfNeeded()
  await button.dblclick()
  await expectAdded(page, before, after)
  const hrefs = await cardHrefs(page)
  expect(new Set(hrefs).size, 'cards repetidas después de dos toques').toBe(hrefs.length)

  await settled(page, path)
  const asked: string[] = []
  let offline = true
  await page.route(api, async (route) => {
    asked.push(route.request().url())
    if (offline) return route.abort('internetdisconnected')
    return route.fallback()
  })
  await button.scrollIntoViewIfNeeded()
  const last = await topOf(page, before)
  await button.click()
  await expect(page.getByRole('alert').filter({ hasText: MORE_OFFLINE })).toBeVisible()
  await expect(wall(page)).toHaveCount(before)
  expect(await topOf(page, before), 'la última card de antes, sin señal, en px').toBe(last)
  offline = false
  await button.click()
  await expectAdded(page, before, after)
  expect(asked, 'los pedidos de «Ver más»').toHaveLength(2)
  expect(asked[1], 'volver a tocar pide los mismos').toBe(asked[0])
  await page.unroute(api)
}

test('el perfil con 50 avales carga su contenido en menos de 2,5 s y baja menos de 150 KB de JS', async ({
  page,
}) => {
  await throttleLikeAPhone(page)
  await page.goto(EVA)
  await expect(page.getByRole('heading', { level: 1, name: 'Eva Pereira' })).toBeVisible()

  const { lcp } = await vitalsOf(page)
  expect(lcp, 'LCP del perfil, en ms').toBeGreaterThan(0)
  expect(lcp, 'LCP del perfil, en ms').toBeLessThan(LCP_MS)

  const { total: scriptBytes } = await scriptWeight(page)
  expect(scriptBytes, 'JS que baja la página, en bytes').toBeGreaterThan(0)
  expect(scriptBytes, 'JS que baja la página, en bytes').toBeLessThan(JS_BYTES)
})

// Covers: criterios 1, 2 y 5 de #332
test('el perfil de una rescatista con 30 animales, foto y 50 avales abre dentro de los 150 KB, con sesión y sin ella', async ({
  page,
}) => {
  test.setTimeout(400_000)
  let rescuer: Rescuer | null = null
  try {
    rescuer = await heaviestRescuer()
    const path = `/perfil/${rescuer.publicId}`
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const anonymous = await measure(page, path)
    const photos = await firstRowPhotosAt(page)
    test.info().annotations.push({
      type: 'rendimiento',
      description: `${path}: la primera fila de fotos a los ${photos.map(Math.round).join(', ')} ms`,
    })

    // Las fotos de los animales tardan 3 s: lo de arriba y las cards ya se leen, y nada se corre
    // cuando llegan.
    let delayed = 0
    await page.route(PET_PHOTOS, async (route) => {
      delayed += 1
      await new Promise((resolve) => setTimeout(resolve, SLOW_PHOTO_MS))
      await route.fallback()
    })
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Prueba' })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Verificado, nivel 3/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Responden por esta persona' })).toBeVisible()
    await expect(wall(page)).toHaveCount(24)
    for (const [index, name] of rescuer.names.slice(0, 24).entries()) {
      const card = page.locator(`#a-${index + 1}`)
      // oxlint-disable-next-line no-await-in-loop -- una card por vez, para decir cuál faltó
      await expect(card.getByText(name, { exact: true }), `la card ${index + 1}`).toBeAttached()
      // oxlint-disable-next-line no-await-in-loop
      await expect(card.getByText(/Pocitos/), `la zona de la card ${index + 1}`).toBeAttached()
    }
    await page.waitForLoadState('networkidle')
    const slow = await vitalsOf(page)
    test.info().annotations.push({
      type: 'rendimiento',
      description: `${path} con las fotos 3 s tarde: CLS ${slow.cls.toFixed(3)}`,
    })
    expect(delayed, 'fotos de animales demoradas').toBeGreaterThan(0)
    expect(slow.cls, 'CLS del perfil con las fotos 3 s tarde').toBeLessThan(CLS)
    await page.unroute(PET_PHOTOS)

    await page.context().clearCookies()
    await signIn(page, rescuer.adopter.email, path)
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Prueba' })).toBeVisible()
    const origin = new URL(page.url()).origin
    const signedIn = await measure(page, `${origin}${path}`)

    expect(photos, 'la primera fila de fotos').toHaveLength(2)
    photos.forEach((at, index) => {
      expect(at, `la foto ${index + 1} de la primera fila, en ms`).toBeLessThan(LCP_MS)
    })
    expectWithin('El perfil de la rescatista, sin sesión', anonymous, PROFILE_TOTAL_KB)
    expectWithin(
      'El perfil de la rescatista, con la sesión de otra persona',
      signedIn,
      PROFILE_TOTAL_KB,
    )
  } finally {
    await cleanUp(rescuer)
  }
})

// Covers: criterios 3, 4 y 5 de #332
test('«Ver más» contesta en menos de 200 ms en el perfil y en el listado, suma una sola vez y avisa sin señal', async ({
  page,
}) => {
  test.setTimeout(400_000)
  let rescuer: Rescuer | null = null
  try {
    rescuer = await heaviestRescuer()
    const path = `/perfil/${rescuer.publicId}`
    await throttleLikeAPhone(page)

    await settled(page, path)
    await tapMore(page, 'el perfil', 24, 30)
    await settled(page, '/animales')
    await tapMore(page, 'el listado', 24, null)

    await tapMoreTwiceAndOffline(page, { path, api: PROFILE_PETS_API }, 24, 30)
    await tapMoreTwiceAndOffline(page, { path: '/animales', api: LISTING_API }, 24, null)
  } finally {
    await cleanUp(rescuer)
  }
})
