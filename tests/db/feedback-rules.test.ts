// Opinar, en la base (historia #71, FR-021 a FR-025, research R8): cualquiera manda, un intento
// guarda una sola opinión y un navegador manda hasta 5 por día. Y lo que hace quien administra en
// Opiniones (US3, research R12). La base local solo tiene datos sintéticos; cada prueba usa su propio
// navegador y borra sus opiniones.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { moderationPeople } from './moderation-support'
import { db, type Functions } from './phone-support'
import { anonClient, asNewUser, type SyntheticUser } from './roles'
import { FIRST_PAGE, insertAsOwner, uruguayDay } from './surveys-support'

const attempts: string[] = []
const browsers: string[] = []
const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)

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

// Días que nadie más usa: las opiniones de las demás pruebas son de hoy.
async function insertFeedback(
  rows: { id: string; body: string; sent_on: string; subject?: string }[],
) {
  await insertAsOwner(
    'feedback',
    rows.map(({ subject, ...row }) => ({
      ...row,
      screen: subject === undefined ? 'listing' : 'pet',
      subject: subject ?? null,
      attempt_id: newAttempt(),
    })),
  )
}

async function listAs(
  client: SyntheticUser['client'],
  before: { on: string; id: string },
  limit: number,
): Promise<Functions['admin_feedback']['Returns']> {
  const { data, error } = await client.rpc('admin_feedback', {
    p_before_on: before.on,
    p_before_id: before.id,
    p_limit: limit,
  })
  expect(error).toBeNull()
  return data ?? []
}

describeDb('Opiniones, para quien administra (R12)', () => {
  // Covers: US3-AS1
  it('de la más nueva a la más vieja, de a p_limit, con la pantalla y sin la persona', async () => {
    const reader = await admin()
    const ids = {
      newest: '00000000-0000-4000-9000-000000000003',
      sameDayHigh: '00000000-0000-4000-9000-000000000002',
      sameDayLow: '00000000-0000-4000-9000-000000000001',
    }
    await insertFeedback([
      { id: ids.sameDayLow, body: 'mismo día, id menor', sent_on: '2999-01-01' },
      { id: ids.newest, body: 'la más nueva', sent_on: '2999-01-02', subject: 'sin-animal' },
      { id: ids.sameDayHigh, body: 'mismo día, id mayor', sent_on: '2999-01-01' },
    ])

    expect(await listAs(reader.client, FIRST_PAGE, 2)).toEqual([
      {
        id: ids.newest,
        body: 'la más nueva',
        screen: 'pet',
        subject: 'sin-animal',
        pet_name: null,
        sent_on: '2999-01-02',
      },
      {
        id: ids.sameDayHigh,
        body: 'mismo día, id mayor',
        screen: 'listing',
        subject: null,
        pet_name: null,
        sent_on: '2999-01-01',
      },
    ])
    const next = await listAs(reader.client, { on: '2999-01-01', id: ids.sameDayHigh }, 2)
    expect(next[0]?.id).toBe(ids.sameDayLow)
    expect(next.map((row) => row.id)).not.toContain(ids.sameDayHigh)
  })

  // Covers: US3-AS2
  it('quien administra la borra para siempre; otra persona no', async () => {
    const [reader, someone] = [await admin(), await person(2)]
    const id = '00000000-0000-4000-9000-000000000004'
    await insertFeedback([{ id, body: 'spam', sent_on: '2999-01-03' }])
    const remove = (client: SyntheticUser['client']) =>
      client.rpc('admin_delete_feedback', { p_id: id })

    expect((await remove(someone.client)).data).toBe('not_found')
    expect(await db().from('feedback').select('id').eq('id', id)).toMatchObject({ data: [{ id }] })
    expect((await remove(reader.client)).data).toBe('deleted')
    expect(await db().from('feedback').select('id').eq('id', id)).toMatchObject({ data: [] })
    expect((await remove(reader.client)).data).toBe('not_found')
  })
})
