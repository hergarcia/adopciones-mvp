import { expect, test, type Page } from '@playwright/test'
import { sendApplication } from './support/applications'
import { publishForRun, removeRunOwner } from './support/listed-pets'
import { newPerson, removePerson } from './support/people'
import { signIn } from './support/pet-owner'
import { settled, slowActions, type SlowActions } from './support/slow-server'
import { expectAnswered, timeTap } from './support/tap-latency'
import { throttleLikeAPhone } from './support/web-vitals'

// Historia #313: cada toque de las pantallas que mueven las métricas de docs/03 contesta en menos de
// 200 ms con red y procesador de teléfono de gama media, la misma emulación que el resto de las
// pruebas de rendimiento. Contesta cuando se ve el primer cambio que provoca, no cuando llega la
// respuesta del servidor. Los toques de «Publicar un animal» están en publicar-rendimiento.spec.ts,
// que ya arma las fotos de 12 megapíxeles.
const SLOW_LISTING_MS = 1_000
const MOTIONS = ['no-preference', 'reduce'] as const

function suffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

// La pared queda apagada mientras llegan los animales: con la respuesta demorada, eso se ve.
async function slowListing(page: Page): Promise<void> {
  await page.route('**/api/animales?**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_LISTING_MS))
    await route.fallback()
  })
}

// Toca dos veces seguidas una acción de la hoja de «Más acciones»: el botón contesta trabajando y
// la acción sale una sola vez.
async function statusTap(
  page: Page,
  actions: SlowActions,
  { label, done, motion }: { label: string; done: string; motion: string },
): Promise<void> {
  await page.getByRole('button', { name: 'Más acciones' }).click()
  const button = page.getByRole('dialog').getByRole('button', { name: label, exact: true })
  await expect(button).toBeVisible()
  actions.reset()
  const name = `«${label}» en «Mis animales» (${motion})`
  const ms = await timeTap(page, name, () => button.dblclick(), [
    { selector: 'button[aria-busy="true"]', text: label },
  ])
  expectAnswered(name, ms)
  await expect(page.getByText(done, { exact: true })).toBeVisible({ timeout: 30_000 })
  expect(actions.count(), `«${label}» tocado dos veces, acciones que salieron`).toBe(1)
}

for (const motion of MOTIONS) {
  test(`el listado y la ficha contestan al toque en menos de 200 ms (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const name = `Luna ${suffix()}`
    const { owner, pets } = await publishForRun([{ name, species: 'dog' }])
    try {
      await page.emulateMedia({ reducedMotion: motion })
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      await throttleLikeAPhone(page)
      await slowListing(page)

      await settled(page, '/animales')
      const dog = await timeTap(
        page,
        `La tirita «Perro» del listado (${motion})`,
        () => page.locator('label', { hasText: /^Perro$/ }).click(),
        [
          { selector: 'label:has(input:checked)', text: 'Perro' },
          { selector: '[aria-busy="true"]' },
        ],
      )
      expectAnswered(`La tirita «Perro» del listado (${motion})`, dog)
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 })

      await settled(page, `/animales/${pets[0].code}`)
      const share = page.getByRole('button', { name: 'Compartir', exact: true }).first()
      await expect(share).toBeVisible()
      const shared = await timeTap(
        page,
        `«Compartir» en la ficha (${motion})`,
        () => share.click(),
        [{ selector: '[data-state="open"]', text: 'Enlace copiado' }],
      )
      expectAnswered(`«Compartir» en la ficha (${motion})`, shared)
    } finally {
      await removeRunOwner(owner.id)
    }
  })

  test(`«Mis animales» contesta a «Marcar en proceso» y «Pausar» en menos de 200 ms, una sola vez (movimiento: ${motion})`, async ({
    page,
  }) => {
    test.setTimeout(150_000)
    const name = `Luna ${suffix()}`
    const { owner } = await publishForRun([{ name, species: 'cat' }])
    try {
      await page.emulateMedia({ reducedMotion: motion })
      await signIn(page, owner.email, '/mis-animales')
      await expect(page).toHaveURL(/mis-animales/)
      const origin = new URL(page.url()).origin
      await throttleLikeAPhone(page)
      const actions = await slowActions(page)
      await settled(page, `${origin}/mis-animales`)

      await statusTap(page, actions, {
        label: 'Marcar en proceso',
        done: `${name} está en proceso`,
        motion,
      })
      await statusTap(page, actions, { label: 'Pausar', done: `${name} quedó pausada`, motion })
    } finally {
      await removeRunOwner(owner.id)
    }
  })
}

test('una solicitud recibida contesta a «Rechazar» y «Aceptar solicitud» en menos de 200 ms, una sola vez', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const { owner, pets } = await publishForRun([{ name: `Luna ${suffix()}`, species: 'dog' }])
  const ana = await newPerson('Ana Prueba', { level: 1 })
  try {
    const id = await sendApplication(ana.id, pets[0].code)
    await signIn(page, owner.email, `/solicitudes/${id}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Prueba' })).toBeVisible()
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    const actions = await slowActions(page)
    await settled(page, `${origin}/solicitudes/${id}`)

    const reject = await timeTap(
      page,
      '«Rechazar» en una solicitud recibida',
      () => page.getByRole('button', { name: 'Rechazar', exact: true }).click(),
      [{ selector: '[role="dialog"]', text: '¿Por qué no seguís con Ana Prueba?' }],
    )
    expectAnswered('«Rechazar» en una solicitud recibida', reject)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const ask = await timeTap(
      page,
      '«Aceptar solicitud» en una solicitud recibida',
      () => page.getByRole('button', { name: 'Aceptar solicitud', exact: true }).click(),
      [{ selector: '[role="dialog"]', text: '¿Aceptar a Ana Prueba?' }],
    )
    expectAnswered('«Aceptar solicitud» en una solicitud recibida', ask)

    actions.reset()
    const confirm = page.getByRole('dialog').getByRole('button', { name: 'Aceptar a Ana Prueba' })
    const accepted = await timeTap(
      page,
      '«Aceptar a Ana Prueba» en la confirmación',
      () => confirm.dblclick(),
      [{ selector: 'button[aria-busy="true"]', text: 'Aceptar a Ana Prueba' }],
    )
    expectAnswered('«Aceptar a Ana Prueba» en la confirmación', accepted)
    await expect(page).toHaveURL(new RegExp(`/solicitudes/${id}\\?aceptada=1$`), {
      timeout: 30_000,
    })
    expect(actions.count(), '«Aceptar» tocado dos veces, acciones que salieron').toBe(1)
  } finally {
    await removePerson(ana)
    await removeRunOwner(owner.id)
  }
})
