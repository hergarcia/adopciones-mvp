// La verificación de teléfono en la base (historia #10): lo que un rol NO ve, lo que NO puede
// escribir, y las reglas que viven en las funciones de la base porque tienen consecuencias —topes,
// intentos, verificar—, incluidas las carreras que las justifican.
//
// Las reglas se pasan chicas: son parámetros, así que los topes se prueban con dos pedidos y no con
// doscientos. `phone_number_sends` no tiene cuenta y sobrevive al borrado de las personas de prueba
// (FR-021), así que el cleanup de asNewUser no lo limpia: se vacía antes y después de cada prueba.
// La base local solo tiene datos sintéticos.
import { createClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { requireEnv } from '../../src/lib/env'
import type { Database } from '../../src/lib/supabase/types'
import { describeDb } from '../setup/env-report'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

type Functions = Database['public']['Functions']
type Reservation = Functions['reserve_phone_code']['Returns'][number]
type Facts = Functions['check_phone_code']['Returns'][number]

// Con los tipos de la base, para leer lo que devuelven las funciones sin afirmar su forma.
function db() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

function firstRow<T>(rows: T[] | null, what: string): T {
  const row = rows?.[0]
  if (row === undefined) throw new Error(`${what} no devolvió ninguna fila`)
  return row
}

const cleanups: SyntheticUser['cleanup'][] = []

async function clearSends() {
  await serviceClient().from('phone_number_sends').delete().gte('id', 0)
}

beforeEach(clearSends)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await clearSends()
})

async function person(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  return user
}

function randomNumber(): string {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `+5989${1 + Math.floor(Math.random() * 9)}${digits}`
}

function randomGroup(): number {
  return Math.floor(Math.random() * 32_768)
}

type Rules = {
  p_code_ttl: string
  p_min_gap: string
  p_window: string
  p_account_cap: number
  p_number_cap: number
  p_site_cap: number
}

const RULES: Rules = {
  p_code_ttl: '10 minutes',
  p_min_gap: '0 seconds',
  p_window: '24 hours',
  p_account_cap: 50,
  p_number_cap: 50,
  p_site_cap: 500,
}

async function reserve(
  userId: string,
  number: string,
  options: { group?: number; digest?: string; rules?: Partial<Rules> } = {},
): Promise<Reservation> {
  const { data, error } = await db().rpc('reserve_phone_code', {
    p_user_id: userId,
    p_number: number,
    p_number_digest: options.group ?? randomGroup(),
    p_code_digest: options.digest ?? 'resumen',
    ...RULES,
    ...options.rules,
  })
  expect(error).toBeNull()
  return firstRow(data, 'reserve_phone_code')
}

async function settle(codeId: string, outcome: 'sent' | 'rejected' | 'failed' = 'sent') {
  const { error } = await serviceClient().rpc('settle_phone_code', {
    p_code_id: codeId,
    p_outcome: outcome,
  })
  expect(error).toBeNull()
}

async function check(userId: string, digest: string, maxAttempts = 5): Promise<Facts> {
  const { data, error } = await db().rpc('check_phone_code', {
    p_user_id: userId,
    p_code_digest: digest,
    p_max_attempts: maxAttempts,
    p_window: '24 hours',
  })
  expect(error).toBeNull()
  return firstRow(data, 'check_phone_code')
}

async function cancel(userId: string) {
  const { error } = await serviceClient().rpc('cancel_pending_phone', { p_user_id: userId })
  expect(error).toBeNull()
}

async function phoneOf(userId: string) {
  const { data } = await db()
    .from('phones')
    .select('verified_number, verified_at, pending_number, pending_since')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

// Intentos equivocados uno detrás del otro, a propósito: en paralelo es otra prueba.
async function wrongTimes(userId: string, times: number): Promise<void> {
  if (times === 0) return
  await check(userId, 'mal')
  await wrongTimes(userId, times - 1)
}

/** Pide un código que sale y lo confirma: la cuenta queda verificada con ese número. */
async function verify(userId: string, number: string, digest = `ok-${number}`) {
  const reserved = await reserve(userId, number, { digest })
  await settle(reserved.code_id)
  return check(userId, digest)
}

describeDb('el teléfono, lo que no se ve', () => {
  // Covers: FR-019, FR-019a, SC-006
  it('la dueña ve su teléfono; nadie más, con o sin sesión', async () => {
    const ana = await person()
    const lucia = await person()
    const number = randomNumber()
    await verify(ana.id, number)

    const own = await ana.client.from('phones').select('verified_number').eq('user_id', ana.id)
    expect(own.data).toEqual([{ verified_number: number }])

    const other = await lucia.client.from('phones').select('*').eq('user_id', ana.id)
    expect(other.data).toEqual([])

    const anon = await anonClient().from('phones').select('*').eq('user_id', ana.id)
    expect(anon.data ?? []).toEqual([])
  })

  // Covers: FR-019c
  it('el registro de pedidos y el conteo por número no los lee nadie, tampoco la dueña', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber())
    await settle(reserved.code_id)

    const reads = await Promise.all(
      [ana.client, anonClient()].flatMap((client) => [
        client.from('phone_codes').select('*'),
        client.from('phone_number_sends').select('*'),
      ]),
    )
    for (const read of reads) expect(read.data ?? []).toEqual([])
  })
})

describeDb('el teléfono, lo que no se puede', () => {
  // Covers: FR-019d. Si la dueña pudiera escribir su fila, se pondría un número verificado sin
  // código; si pudiera borrar sus pedidos o sus intentos, se saltearía los topes.
  it('la dueña no se escribe un teléfono verificado, ni lo cambia, ni lo borra', async () => {
    const ana = await person()
    const inserted = await ana.client
      .from('phones')
      .insert({ user_id: ana.id, verified_number: randomNumber(), verified_at: 'now()' })
    expect(inserted.error).not.toBeNull()

    await verify(ana.id, randomNumber())
    const updated = await ana.client
      .from('phones')
      .update({ verified_at: '2020-01-01' })
      .eq('user_id', ana.id)
      .select()
    expect(updated.data ?? []).toEqual([])
    const deleted = await ana.client.from('phones').delete().eq('user_id', ana.id).select()
    expect(deleted.data ?? []).toEqual([])
    expect((await phoneOf(ana.id))?.verified_at).not.toContain('2020')
  })

  it('la dueña no toca su registro de pedidos ni los intentos de su código', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber())
    await settle(reserved.code_id)
    await check(ana.id, 'equivocado')

    const reset = await ana.client
      .from('phone_codes')
      .update({ failed_attempts: 0 })
      .eq('user_id', ana.id)
      .select()
    expect(reset.data ?? []).toEqual([])
    const erased = await ana.client.from('phone_codes').delete().eq('user_id', ana.id).select()
    expect(erased.data ?? []).toEqual([])
    const forged = await ana.client.from('phone_codes').insert({
      user_id: ana.id,
      number: randomNumber(),
      expires_at: 'now()',
      delivery: 'sent',
    })
    expect(forged.error).not.toBeNull()

    const { data } = await serviceClient()
      .from('phone_codes')
      .select('failed_attempts')
      .eq('id', reserved.code_id)
      .single()
    expect(data?.failed_attempts).toBe(1)
  })

  it('nadie toca el conteo por número ni el techo del sitio', async () => {
    const ana = await person()
    await reserve(ana.id, randomNumber())

    const clients = [ana.client, anonClient()]
    const erased = await Promise.all(
      clients.map((client) => client.from('phone_number_sends').delete().gte('id', 0).select()),
    )
    for (const attempt of erased) expect(attempt.data ?? []).toEqual([])
    const forged = await Promise.all(
      clients.map((client) => client.from('phone_number_sends').insert({ number_digest: 1 })),
    )
    for (const attempt of forged) expect(attempt.error).not.toBeNull()
    const { count } = await serviceClient()
      .from('phone_number_sends')
      .select('id', { count: 'exact', head: true })
    expect(count).toBe(1)
  })

  it('las funciones de la base no se pueden llamar con sesión ni sin ella', async () => {
    const ana = await person()
    const calls: [string, Record<string, unknown>][] = [
      [
        'reserve_phone_code',
        {
          p_user_id: ana.id,
          p_number: randomNumber(),
          p_number_digest: 1,
          p_code_digest: 'x',
          ...RULES,
        },
      ],
      [
        'check_phone_code',
        { p_user_id: ana.id, p_code_digest: 'x', p_max_attempts: 5, p_window: '24 hours' },
      ],
      ['settle_phone_code', { p_code_id: crypto.randomUUID(), p_outcome: 'sent' }],
      ['cancel_pending_phone', { p_user_id: ana.id }],
      ['purge_phone_records', { p_window: '24 hours', p_pending_ttl: '7 days' }],
      [
        'next_phone_code_at',
        {
          p_user_id: ana.id,
          p_min_gap: '60 seconds',
          p_window: '24 hours',
          p_account_cap: 5,
          p_site_cap: 200,
        },
      ],
      ['lock_phone_account', { p_user_id: ana.id }],
    ]
    const attempts = await Promise.all(
      [ana.client, anonClient()].flatMap((client) =>
        calls.map(async ([name, args]) => ({ name, error: (await client.rpc(name, args)).error })),
      ),
    )
    expect(attempts.filter((attempt) => attempt.error === null).map((a) => a.name)).toEqual([])
    expect((await phoneOf(ana.id))?.pending_number ?? null).toBeNull()
  })
})

describeDb('los topes', () => {
  // Covers: FR-010.1
  it('la espera entre códigos', async () => {
    const ana = await person()
    const first = await reserve(ana.id, randomNumber(), { rules: { p_min_gap: '60 seconds' } })
    expect(first.decision).toBe('send')
    const second = await reserve(ana.id, randomNumber(), { rules: { p_min_gap: '60 seconds' } })
    expect(second.decision).toBe('wait')
    expect(new Date(second.retry_at).getTime()).toBeGreaterThan(Date.now())
  })

  // Covers: FR-010.2, FR-009a, FR-002a
  it('el tope de la cuenta: cuentan los rechazados, no los que fallaron', async () => {
    const ana = await person()
    const rules = { p_account_cap: 2 }
    const failed = await reserve(ana.id, randomNumber(), { rules })
    await settle(failed.code_id, 'failed')
    const rejected = await reserve(ana.id, randomNumber(), { rules })
    await settle(rejected.code_id, 'rejected')
    const last = await reserve(ana.id, randomNumber(), { rules })
    expect(last.decision).toBe('send')
    expect(last.reached_cap).toBe(true)
    await settle(last.code_id)

    const refused = await reserve(ana.id, randomNumber(), { rules })
    expect(refused.decision).toBe('daily_cap')
    expect(new Date(refused.retry_at).getTime()).toBeGreaterThan(Date.now() + 23 * 3_600_000)
  })

  // Covers: FR-011, FR-006a
  it('el tope por número suma cuentas y frena en silencio, con un código que da equivocado', async () => {
    const ana = await person()
    const lucia = await person()
    const number = randomNumber()
    const group = randomGroup()
    const rules = { p_number_cap: 1 }

    const first = await reserve(ana.id, number, { group, rules })
    expect(first.decision).toBe('send')
    await settle(first.code_id)

    const skipped = await reserve(lucia.id, number, { group, rules, digest: 'no-salio' })
    expect(skipped.decision).toBe('skip')
    expect((await phoneOf(lucia.id))?.pending_number).toBe(number)

    const facts = await check(lucia.id, 'cualquiera')
    expect(facts).toMatchObject({ verified: false, expired: false, attempts_left: 4 })
  })

  // Covers: FR-011b
  it('el techo del sitio cuenta también los frenados en silencio', async () => {
    const [ana, lucia, marta] = [await person(), await person(), await person()]
    const group = randomGroup()
    const rules = { p_number_cap: 1, p_site_cap: 2 }

    const sent = await reserve(ana.id, randomNumber(), { group, rules })
    await settle(sent.code_id)
    const skipped = await reserve(lucia.id, randomNumber(), { group, rules })
    expect(skipped.decision).toBe('skip')
    expect(skipped.reached_site_cap).toBe(true)

    const refused = await reserve(marta.id, randomNumber(), { rules })
    expect(refused.decision).toBe('site_cap')
  })

  // Covers: FR-017c
  it('pedir el número que ya está verificado no cuenta ni cambia nada', async () => {
    const ana = await person()
    const number = randomNumber()
    await verify(ana.id, number)
    const again = await reserve(ana.id, number, { rules: { p_min_gap: '1 hour' } })
    expect(again.decision).toBe('same_number')
    expect((await phoneOf(ana.id))?.pending_number).toBeNull()
  })

  // Covers: SC-005. Sin el candado, los veinte pasan el chequeo antes de que el primero se anote.
  it('veinte pedidos en paralelo dan un solo envío', async () => {
    const ana = await person()
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        reserve(ana.id, randomNumber(), { rules: { p_min_gap: '60 seconds' } }),
      ),
    )
    expect(results.filter((r) => r.decision === 'send')).toHaveLength(1)
    expect(results.filter((r) => r.decision === 'wait')).toHaveLength(19)
  })
})

describeDb('el código', () => {
  // Covers: FR-006, FR-007a
  it('vale solamente el último: el anterior da reemplazado y cuenta como intento', async () => {
    const ana = await person()
    const number = randomNumber()
    const old = await reserve(ana.id, number, { digest: 'viejo' })
    await settle(old.code_id)
    const fresh = await reserve(ana.id, number, { digest: 'nuevo' })
    await settle(fresh.code_id)

    const facts = await check(ana.id, 'viejo')
    expect(facts).toMatchObject({ verified: false, matches_superseded: true, attempts_left: 4 })
    expect(facts.live_number).toBe(number)
  })

  // Covers: FR-006
  it('un pedido que falló no mata al código que la persona tenía', async () => {
    const ana = await person()
    const number = randomNumber()
    const good = await reserve(ana.id, number, { digest: 'bueno' })
    await settle(good.code_id)
    const failed = await reserve(ana.id, number, { digest: 'fallido' })
    await settle(failed.code_id, 'failed')

    expect(await check(ana.id, 'bueno')).toMatchObject({ verified: true })
  })

  // Covers: FR-007, SC-003
  it('al quinto equivocado muere, y el correcto ya no sirve', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber(), { digest: 'correcto' })
    await settle(reserved.code_id)
    await wrongTimes(ana.id, 4)
    expect(await check(ana.id, 'mal')).toMatchObject({ exhausted: true, attempts_left: 0 })
    expect(await check(ana.id, 'correcto')).toMatchObject({ verified: false, exhausted: true })
  })

  // Covers: SC-003. Sin el candado, diez intentos en paralelo se saltean el límite de cinco.
  it('diez intentos en paralelo no dan un sexto', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber(), { digest: 'correcto' })
    await settle(reserved.code_id)
    await Promise.all(Array.from({ length: 10 }, () => check(ana.id, 'mal')))

    const { data } = await serviceClient()
      .from('phone_codes')
      .select('failed_attempts')
      .eq('id', reserved.code_id)
      .single()
    expect(data?.failed_attempts).toBe(5)
    expect(await check(ana.id, 'correcto')).toMatchObject({ verified: false })
  })

  it('vencido, no verifica ni suma intentos', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber(), {
      digest: 'correcto',
      rules: { p_code_ttl: '0 seconds' },
    })
    await settle(reserved.code_id)
    expect(await check(ana.id, 'correcto')).toMatchObject({
      verified: false,
      expired: true,
      attempts_left: 5,
    })
  })

  // Covers: FR-008a, SC-002
  it('dos cuentas confirmando el mismo número a la vez: una sola queda verificada', async () => {
    const ana = await person()
    const lucia = await person()
    const number = randomNumber()
    await Promise.all(
      [ana, lucia].map(async (user) => {
        const reserved = await reserve(user.id, number, { digest: `ok-${user.id}` })
        await settle(reserved.code_id)
      }),
    )
    const [a, l] = await Promise.all([
      check(ana.id, `ok-${ana.id}`),
      check(lucia.id, `ok-${lucia.id}`),
    ])
    expect([a.verified, l.verified].filter(Boolean)).toHaveLength(1)
    expect([a.in_use, l.in_use].filter(Boolean)).toHaveLength(1)
  })

  // Covers: FR-008, FR-008b
  it('número en uso: el código queda usado y el número a medias se descarta', async () => {
    const ana = await person()
    const lucia = await person()
    const number = randomNumber()
    await verify(ana.id, number)

    const reserved = await reserve(lucia.id, number, { digest: 'ok' })
    await settle(reserved.code_id)
    expect(await check(lucia.id, 'ok')).toMatchObject({ verified: false, in_use: true })
    expect(await phoneOf(lucia.id)).toBeNull()
    expect(await check(lucia.id, 'ok')).toMatchObject({ no_pending: true })
  })
})

describeDb('el cambio de número y cancelar', () => {
  // Covers: FR-017b, US3-AS4
  it('cancelar un cambio devuelve el número anterior con su fecha original', async () => {
    const ana = await person()
    const old = randomNumber()
    await verify(ana.id, old)
    const before = await phoneOf(ana.id)

    const reserved = await reserve(ana.id, randomNumber())
    await settle(reserved.code_id)
    expect((await phoneOf(ana.id))?.pending_number).not.toBeNull()

    await cancel(ana.id)
    expect(await phoneOf(ana.id)).toEqual({ ...before, pending_number: null, pending_since: null })
  })

  // Covers: FR-017b
  it('cancelar una primera verificación deja la cuenta sin teléfono', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber())
    await settle(reserved.code_id)
    await cancel(ana.id)
    expect(await phoneOf(ana.id)).toBeNull()
  })

  // Covers: FR-015a. Entre reserve y settle pasa una llamada de red.
  it('un settle que llega después de cancelar no revive el número a medias', async () => {
    const ana = await person()
    const reserved = await reserve(ana.id, randomNumber())
    await cancel(ana.id)
    await settle(reserved.code_id)
    expect(await phoneOf(ana.id)).toBeNull()
  })

  // Covers: FR-017a
  it('durante un cambio a medias, nadie más puede verificar el número anterior', async () => {
    const ana = await person()
    const lucia = await person()
    const old = randomNumber()
    await verify(ana.id, old)
    const change = await reserve(ana.id, randomNumber())
    await settle(change.code_id)

    expect(await verify(lucia.id, old)).toMatchObject({ verified: false, in_use: true })
  })

  // Covers: FR-017, FR-017a, US3-AS1
  it('al confirmar el nuevo, el anterior queda libre y la fecha es la nueva', async () => {
    const ana = await person()
    const lucia = await person()
    const old = randomNumber()
    await verify(ana.id, old)
    const before = await phoneOf(ana.id)

    const fresh = randomNumber()
    expect(await verify(ana.id, fresh)).toMatchObject({ verified: true, was_change: true })
    const after = await phoneOf(ana.id)
    expect(after?.verified_number).toBe(fresh)
    expect(after?.verified_at).not.toBe(before?.verified_at)

    expect(await verify(lucia.id, old)).toMatchObject({ verified: true })
  })

  // Covers: FR-017d
  it('pedir un código para un tercer número reemplaza al que estaba a medias', async () => {
    const ana = await person()
    const second = await reserve(ana.id, randomNumber(), { digest: 'segundo' })
    await settle(second.code_id)
    const third = randomNumber()
    const reserved = await reserve(ana.id, third, { digest: 'tercero' })
    await settle(reserved.code_id)

    expect((await phoneOf(ana.id))?.pending_number).toBe(third)
    expect(await check(ana.id, 'segundo')).toMatchObject({ matches_superseded: true })
  })
})

describeDb('borrar la cuenta', () => {
  // Covers: FR-020, FR-021. El conteo por número sobrevive porque no nombra a nadie.
  it('borra el teléfono y los pedidos de la persona, y deja el conteo por número', async () => {
    const ana = await asNewUser()
    const reserved = await reserve(ana.id, randomNumber())
    await settle(reserved.code_id)
    await verify(ana.id, randomNumber())

    await ana.cleanup()

    expect(await phoneOf(ana.id)).toBeNull()
    const codes = await serviceClient().from('phone_codes').select('id').eq('user_id', ana.id)
    expect(codes.data).toEqual([])
    const { count } = await serviceClient()
      .from('phone_number_sends')
      .select('id', { count: 'exact', head: true })
    expect(count).toBe(2)
  })
})
