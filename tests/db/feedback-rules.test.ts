// Opinar, en la base (historia #71, FR-021 a FR-025, research R8): cualquiera manda, un intento
// guarda una sola opinión y un navegador manda hasta 5 por día. La base local solo tiene datos
// sintéticos; cada prueba usa su propio navegador y borra sus opiniones.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { db } from './phone-support'
import { anonClient, asNewUser, type SyntheticUser } from './roles'
import { uruguayDay } from './surveys-support'

const attempts: string[] = []
const browsers: string[] = []
const cleanups: SyntheticUser['cleanup'][] = []

afterEach(async () => {
  await db().from('feedback').delete().in('attempt_id', attempts.splice(0))
  await db().from('feedback_quota').delete().in('browser_hash', browsers.splice(0))
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

function newBrowser(): string {
  const hash = `test-${crypto.randomUUID()}`
  browsers.push(hash)
  return hash
}

function newAttempt(): string {
  const attempt = crypto.randomUUID()
  attempts.push(attempt)
  return attempt
}

type Sent = {
  browser: string
  attempt?: string
  body?: string
  screen?: string
  subject?: string | null
  client?: SyntheticUser['client']
}

async function send({
  browser,
  attempt = newAttempt(),
  body = 'no entiendo por qué me piden el teléfono',
  screen = 'pet',
  subject = null,
  client = anonClient(),
}: Sent): Promise<unknown> {
  const { data, error } = await client.rpc('send_feedback', {
    p_browser_hash: browser,
    p_attempt: attempt,
    p_body: body,
    p_screen: screen,
    p_subject: subject,
  })
  expect(error).toBeNull()
  return data
}

async function rowsOf(attempt: string) {
  const { data, error } = await db().from('feedback').select('*').eq('attempt_id', attempt)
  expect(error).toBeNull()
  return data ?? []
}

async function quotaOf(browser: string) {
  const { data, error } = await db()
    .from('feedback_quota')
    .select('day, sent')
    .eq('browser_hash', browser)
    .order('day')
  expect(error).toBeNull()
  return data ?? []
}

describeDb('una opinión se manda con o sin sesión (FR-021, FR-022, FR-051)', () => {
  // Covers: US2-AS1
  it('un visitante la manda y queda con el día y la pantalla, sin la persona', async () => {
    const browser = newBrowser()
    const attempt = newAttempt()
    expect(
      await send({ browser, attempt, body: '  hola equipo  ', screen: 'pet', subject: 'luna1' }),
    ).toBe('sent')
    const [row] = await rowsOf(attempt)
    expect(row).toMatchObject({
      body: 'hola equipo',
      screen: 'pet',
      subject: 'luna1',
      sent_on: await uruguayDay(0),
    })
    expect(await quotaOf(browser)).toEqual([{ day: await uruguayDay(0), sent: 1 }])
  })

  // Covers: US2-AS10
  it('con sesión llega igual, sin nada que la una a la persona', async () => {
    const someone = await asNewUser()
    cleanups.push(someone.cleanup)
    const attempt = newAttempt()
    expect(await send({ browser: newBrowser(), attempt, client: someone.client })).toBe('sent')
    const [row] = await rowsOf(attempt)
    expect(Object.values(row ?? {})).not.toContain(someone.id)
  })
})

describeDb('un intento guarda una sola opinión (FR-025)', () => {
  // Covers: US2-AS8, US2-AS9
  it('el mismo intento dos veces es already y deja una fila y una cuenta', async () => {
    const browser = newBrowser()
    const attempt = newAttempt()
    expect(await send({ browser, attempt })).toBe('sent')
    expect(await send({ browser, attempt })).toBe('already')
    expect(await rowsOf(attempt)).toHaveLength(1)
    expect(await quotaOf(browser)).toEqual([{ day: await uruguayDay(0), sent: 1 }])
  })

  it('el mismo intento después del tope sigue siendo already', async () => {
    const browser = newBrowser()
    const first = newAttempt()
    expect(await send({ browser, attempt: first })).toBe('sent')
    for (let index = 0; index < 4; index += 1) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await send({ browser })).toBe('sent')
    }
    expect(await send({ browser, attempt: first })).toBe('already')
  })
})

describeDb('hasta 5 por día y por navegador (FR-023)', () => {
  // Covers: US2-AS7
  it('la sexta del mismo navegador es limit y no se guarda; otro navegador manda', async () => {
    const browser = newBrowser()
    for (let index = 0; index < 5; index += 1) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await send({ browser })).toBe('sent')
    }
    const sixth = newAttempt()
    expect(await send({ browser, attempt: sixth })).toBe('limit')
    expect(await rowsOf(sixth)).toHaveLength(0)
    expect(await quotaOf(browser)).toEqual([{ day: await uruguayDay(0), sent: 5 }])
    expect(await send({ browser: newBrowser() })).toBe('sent')
  })

  it('al otro día vuelve a mandar y la cuenta de ayer se borra', async () => {
    const browser = newBrowser()
    const yesterday = await uruguayDay(1)
    const { error } = await db()
      .from('feedback_quota')
      .insert({ browser_hash: browser, day: yesterday, sent: 5 })
    expect(error).toBeNull()
    expect(await send({ browser })).toBe('sent')
    expect(await quotaOf(browser)).toEqual([{ day: await uruguayDay(0), sent: 1 }])
  })
})

describeDb('lo que no se guarda (FR-021, FR-022)', () => {
  it.each([
    ['vacía', { body: '' }],
    ['solo espacios', { body: '   ' }],
    ['de 1.001 caracteres', { body: 'a'.repeat(1001) }],
    ['de una pantalla desconocida', { screen: 'checkout' }],
    ['con sujeto en una pantalla privada', { screen: 'my_pets', subject: 'x' }],
    ['sin navegador', { browser: '' }],
  ])('%s → invalid y nada guardado', async (_case, overrides) => {
    const browser = newBrowser()
    const attempt = newAttempt()
    expect(await send({ browser, attempt, ...overrides })).toBe('invalid')
    expect(await rowsOf(attempt)).toHaveLength(0)
    expect(await quotaOf(browser)).toEqual([])
  })

  it('1.000 caracteres sí', async () => {
    expect(await send({ browser: newBrowser(), body: 'a'.repeat(1000) })).toBe('sent')
  })
})
