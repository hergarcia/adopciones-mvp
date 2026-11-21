import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { expect, test, type Page } from '@playwright/test'
import { hasMail, linkFor, mailsTo } from './support/mailbox'
import { withoutCache } from './support/opening-weight'
import { service, signIn } from './support/pet-owner'
import {
  expectOpenWithin,
  expectTotalWithin,
  expectVitals,
  measure,
  type Measured,
} from './support/screen-budget'
import { openEmailSignIn, uniqueEmail } from './support/sign-in'
import { settled, slowActions } from './support/slow-server'
import { expectAnswered, timeTap } from './support/tap-latency'
import { throttleLikeAPhone, vitalsOf } from './support/web-vitals'

// Historia #326: las tres pantallas del alta que ve toda persona nueva antes de verificarse entran
// al presupuesto del camino a adoptar (docs/07 §Presupuesto de performance), con red y procesador de
// teléfono de gama media. Los totales de `main` antes de #326, iguales en dos corridas y redondeados
// hacia arriba al décimo de KB: impiden esconder peso de apertura corriéndolo a después de abrir.
const SIGN_IN_TOTAL_KB = 142.8
const SIGN_IN_GOOGLE_TOTAL_KB = 142.8
const CHECK_EMAIL_TOTAL_KB = 141.9
const COMPLETE_PROFILE_TOTAL_KB = 232.5

const LOGIN_SUBJECT = 'Tu enlace para entrar'
const LOGIN_MAILS = /^Tu enlace para entrar$/
const SLOW_WAKE_MS = 3_000
// La espera entre dos pedidos del mismo navegador (MIN_SECONDS_BETWEEN_REQUESTS), con margen.
const RESEND_WAIT_MS = 75_000

type Newcomer = { id: string; email: string }

function expectWithin(screen: string, measured: Measured, totalKb: number) {
  expectVitals(screen, measured)
  expectOpenWithin(screen, measured)
  expectTotalWithin(screen, measured, totalKb)
}

// Una cuenta sin perfil, como la de quien recién entra por primera vez: abrir el enlace lleva a
// «Contá quién sos».
async function newcomer(): Promise<Newcomer> {
  const email = uniqueEmail()
  const created = await service().auth.admin.createUser({ email, email_confirm: true })
  expect(created.error).toBeNull()
  return { id: created.data.user?.id ?? '', email }
}

async function remove(person: Newcomer): Promise<void> {
  await service().auth.admin.deleteUser(person.id)
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

// El servidor de las pruebas no tiene Google, como CI (FR-011 de #9): «Entrar con Google» se mide en
// un segundo servidor del mismo build, con el interruptor prendido como en la beta.
async function startWithGoogle(): Promise<{ origin: string; stop: () => void }> {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const server: ChildProcess = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], {
    env: {
      ...process.env,
      GOOGLE_SIGN_IN_ENABLED: 'true',
      RESEND_API_KEY: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN: '',
      TWILIO_MESSAGING_SERVICE_SID: '',
    },
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(`${origin}/entrar`)).status
        } catch {
          return 0
        }
      },
      { timeout: 60_000, message: 'el segundo servidor, con Google' },
    )
    .toBe(200)
  return { origin, stop: () => server.kill() }
}

// Cada pedido de código de la pantalla tarda en llegar: el campo aparece con el HTML y la pantalla
// termina de despertar 3 segundos después.
async function slowWake(page: Page): Promise<void> {
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_WAKE_MS))
    await route.fallback()
  })
}

const isAwake = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).some((input) =>
      Object.keys(input).some((key) => key.startsWith('__reactFiber')),
    ),
  )

// Covers: criterios 1 y 5 de #326
test('«Entrá sin contraseña», «Mirá tu correo» y «Contá quién sos» abren dentro de los 150 KB', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const person = await newcomer()
  try {
    await page.goto('/entrar')
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    await withoutCache(page)
    const signInScreen = await measure(page, `${origin}/entrar`)

    await openEmailSignIn(page)
    await expect(page.getByRole('button', { name: 'Enviarme el enlace' })).toBeEnabled()
    await page.getByRole('textbox').fill(person.email)
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page).toHaveURL(/revisa-tu-correo/, { timeout: 30_000 })
    const checkEmail = await measure(page, page.url())

    await expect.poll(() => hasMail(person.email, LOGIN_SUBJECT)).toBe(true)
    await page.goto(linkFor(person.email))
    await expect(page).toHaveURL(/completar-perfil/, { timeout: 30_000 })
    // El enlace vuelve por el origen del sitio, que puede no ser el de la prueba: la sesión es de ese.
    const completeProfile = await measure(page, page.url())

    expectWithin('«Entrá sin contraseña»', signInScreen, SIGN_IN_TOTAL_KB)
    expectWithin('«Mirá tu correo»', checkEmail, CHECK_EMAIL_TOTAL_KB)
    expectWithin('«Contá quién sos»', completeProfile, COMPLETE_PROFILE_TOTAL_KB)
  } finally {
    await remove(person)
  }
})

test.describe('con Google', () => {
  let google: { origin: string; stop: () => void } | null = null
  test.beforeAll(async () => {
    test.setTimeout(90_000)
    google = await startWithGoogle()
  })
  test.afterAll(() => google?.stop())

  // Covers: criterios 1, 2 y 5 de #326
  test('«Entrá sin contraseña» con Google abre dentro de los 150 KB y «Entrar con Google» contesta una sola vez', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const origin = google?.origin ?? ''
    await page.goto(`${origin}/entrar`)
    await throttleLikeAPhone(page)
    await withoutCache(page)
    expectWithin(
      '«Entrá sin contraseña» con Google',
      await measure(page, `${origin}/entrar`),
      SIGN_IN_GOOGLE_TOTAL_KB,
    )

    // Google no está en la base local: la pantalla de Google se reemplaza por una vacía.
    await page.route('**/auth/v1/authorize**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>.</title>',
      }),
    )
    const actions = await slowActions(page)
    await settled(page, `${origin}/entrar`)
    const button = page.getByRole('button', { name: 'Entrar con Google' })
    await expect(button).toBeEnabled()
    actions.reset()
    const name = '«Entrar con Google» tocado dos veces'
    const ms = await timeTap(page, name, () => button.dblclick(), [
      { selector: 'button[aria-busy="true"]', text: 'Entrar con Google' },
    ])
    expectAnswered(name, ms)
    await expect(page).toHaveURL(/auth\/v1\/authorize/, { timeout: 30_000 })
    expect(actions.count(), `${name}, pedidos que salieron`).toBe(1)
  })
})

// Covers: criterios 2 y 5 de #326
test('«Enviarme el enlace» y «Enviar otro» contestan en menos de 200 ms y mandan un correo por toque', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const person = await newcomer()
  try {
    await page.goto('/entrar')
    const origin = new URL(page.url()).origin
    await throttleLikeAPhone(page)
    const actions = await slowActions(page)
    await settled(page, `${origin}/entrar`)
    await openEmailSignIn(page)
    const send = page.getByRole('button', { name: 'Enviarme el enlace' })
    await expect(send).toBeEnabled()
    await page.getByRole('textbox').fill(person.email)

    actions.reset()
    const sendName = '«Enviarme el enlace» tocado dos veces'
    const sent = await timeTap(page, sendName, () => send.dblclick(), [
      { selector: 'button[aria-busy="true"]', text: 'Enviarme el enlace' },
    ])
    expectAnswered(sendName, sent)
    await expect(page).toHaveURL(/revisa-tu-correo/, { timeout: 30_000 })
    expect(actions.count(), `${sendName}, pedidos que salieron`).toBe(1)
    await expect.poll(() => mailsTo(person.email, LOGIN_MAILS).length).toBe(1)

    const resend = page.getByRole('button', { name: 'Enviar otro' })
    await expect(resend).toBeEnabled({ timeout: RESEND_WAIT_MS })
    actions.reset()
    const resendName = '«Enviar otro» tocado dos veces'
    const resent = await timeTap(page, resendName, () => resend.dblclick(), [
      { selector: 'button[aria-busy="true"]', text: 'Enviar otro' },
    ])
    expectAnswered(resendName, resent)
    await expect(page.getByText('Te mandamos otro enlace')).toBeVisible({ timeout: 30_000 })
    expect(actions.count(), `${resendName}, pedidos que salieron`).toBe(1)
    await expect.poll(() => mailsTo(person.email, LOGIN_MAILS).length).toBe(2)
  } finally {
    await remove(person)
  }
})

// Covers: criterios 3 y 4 de #326
test('lo escrito en «Contá quién sos» antes de que despierte sigue ahí, y «Guardar» lleva a lo que falta', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const person = await newcomer()
  try {
    await signIn(page, person.email, '/completar-perfil')
    await expect(page).toHaveURL(/completar-perfil/, { timeout: 30_000 })
    const url = page.url()
    await throttleLikeAPhone(page)
    await slowWake(page)

    await page.goto(url, { waitUntil: 'commit' })
    const name = page.getByRole('textbox', { name: 'Cómo te llamás' })
    await name.click()
    expect(await isAwake(page), 'la pantalla todavía no despertó al escribir').toBe(false)
    await page.keyboard.type('Ana García')
    await expect.poll(() => isAwake(page), { timeout: 30_000 }).toBe(true)
    await page.waitForLoadState('networkidle')

    await expect(name).toHaveValue('Ana García')
    await expect(name).toBeFocused()
    expect(
      await name.evaluate((input) =>
        input instanceof HTMLInputElement ? [input.selectionStart, input.selectionEnd] : [],
      ),
      'el cursor, al final de lo escrito',
    ).toEqual([10, 10])
    const { cls } = await vitalsOf(page)
    expect(cls, 'CLS de «Contá quién sos» al despertar').toBeLessThan(0.05)

    // Lo escrito quedó también en el formulario, no solo en la pantalla: al guardar, al nombre no le
    // falta nada.
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page.getByText('Elegí tu departamento.')).toBeVisible()
    await expect(page.getByText('Escribí cómo te llamás.')).toHaveCount(0)
    await expect(name).toHaveValue('Ana García')
  } finally {
    await remove(person)
  }
})

// Covers: criterios 2 y 5 de #326
test('«Guardar» en «Contá quién sos» contesta en menos de 200 ms y guarda una sola vez', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const person = await newcomer()
  try {
    await signIn(page, person.email, '/completar-perfil')
    await expect(page).toHaveURL(/completar-perfil/, { timeout: 30_000 })
    const url = page.url()
    await throttleLikeAPhone(page)
    const actions = await slowActions(page)
    await settled(page, url)

    await page.getByRole('textbox', { name: 'Cómo te llamás' }).fill('Ana García')
    await page.getByRole('combobox', { name: 'Departamento' }).click()
    await page.getByRole('option', { name: 'Rocha' }).click()
    await page.getByRole('combobox', { name: 'Localidad' }).fill('La Paloma')

    actions.reset()
    const save = page.getByRole('button', { name: 'Guardar', exact: true })
    const name = '«Guardar» en «Contá quién sos» tocado dos veces'
    const ms = await timeTap(page, name, () => save.dblclick(), [
      { selector: 'button[aria-busy="true"]', text: 'Guardar' },
    ])
    expectAnswered(name, ms)
    await expect(page).toHaveURL(/mi-perfil/, { timeout: 30_000 })
    expect(actions.count(), `${name}, guardados que salieron`).toBe(1)
  } finally {
    await remove(person)
  }
})
