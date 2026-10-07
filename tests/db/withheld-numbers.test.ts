// El número de una cuenta suspendida, y el retenido después de borrarla (historia #13, US4,
// research R8): no se verifica en otra cuenta ni quedándose con él, el retenido es un HMAC con fecha
// que nadie lee, y borrar la cuenta nunca se traba por guardarlo.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { WITHHELD_MONTHS } from '../../src/lib/moderation/rules'
import { describeDb } from '../setup/env-report'
import { lift, moderationPeople, suspend } from './moderation-support'
import {
  check,
  clearSends,
  db,
  firstRow,
  phoneOf,
  randomNumber,
  reserve,
  settle,
  verify,
} from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const people = moderationPeople(cleanups)

beforeEach(clearSends)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await clearSends()
})

async function numberOf(userId: string): Promise<string> {
  const number = (await phoneOf(userId))?.verified_number
  if (!number) throw new Error('la persona no tiene número verificado')
  return number
}

async function claimOf(userId: string) {
  const { data } = await db().from('phone_claims').select('number').eq('user_id', userId)
  return data ?? []
}

async function claim(userId: string, number: string) {
  const { data, error } = await db().rpc('claim_phone_number', {
    p_user_id: userId,
    p_number: number,
    p_time_zone: 'America/Montevideo',
  })
  expect(error).toBeNull()
  return firstRow(data, 'claim_phone_number')
}

async function withheldRows() {
  const { data, error } = await db().from('withheld_numbers').select('number_hash, until')
  expect(error).toBeNull()
  return data ?? []
}

/** Borra la cuenta como la borra el sitio, y devuelve lo que quedó retenido por ese borrado. */
async function deleteAccount(userId: string) {
  const before = new Set((await withheldRows()).map((row) => row.number_hash))
  const { error } = await serviceClient().auth.admin.deleteUser(userId)
  expect(error).toBeNull()
  return (await withheldRows()).filter((row) => !before.has(row.number_hash))
}

async function accountExists(userId: string): Promise<boolean> {
  const { data } = await serviceClient().auth.admin.getUserById(userId)
  return data.user !== null
}

// La clave vive en Vault, que no se expone por la API: se le cambia el nombre con el CLI del
// proyecto, y se le devuelve después, así la clave no cambia para el resto de las pruebas. El CLI
// va con el mismo Node y sin shell: en Windows cmd.exe partía el SQL en varios argumentos.
const SUPABASE_CLI = 'node_modules/supabase/dist/supabase.js'

function renameKey(from: string, to: string) {
  execFileSync(
    process.execPath,
    [
      SUPABASE_CLI,
      'db',
      'query',
      '--local',
      `select vault.update_secret(id, null, '${to}') from vault.secrets where name = '${from}'`,
    ],
    { stdio: 'ignore' },
  )
}

const MONTH_MS = 30 * 24 * 3_600_000

describeDb('el número de una cuenta suspendida', () => {
  // Covers: US4-AS1, FR-026
  it('NO se verifica en otra cuenta: el código queda usado, sin prueba y sin nada a medias', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    await suspend(ana.id)
    const bea = await people.person(0, 'Bea')

    expect(await verify(bea.id, number)).toMatchObject({
      verified: false,
      withheld: true,
      in_use: false,
    })
    expect(await claimOf(bea.id)).toEqual([])
    expect(await phoneOf(bea.id)).toBeNull()
    expect(await check(bea.id, `ok-${number}`)).toMatchObject({ withheld: false, no_pending: true })
    expect(await numberOf(ana.id)).toBe(number)
  })

  it('con otro verificado, la cuenta vuelve a su número de antes', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    await suspend(ana.id)
    const bea = await people.person(1, 'Bea')
    const own = await numberOf(bea.id)

    expect(await verify(bea.id, number)).toMatchObject({ withheld: true, was_change: false })
    expect(await phoneOf(bea.id)).toMatchObject({ verified_number: own, pending_number: null })
  })

  // Covers: US4-AS2, FR-026
  it('NO se queda con él una prueba de antes de la suspensión', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    const bea = await people.person(0, 'Bea')
    expect(await verify(bea.id, number)).toMatchObject({ in_use: true, withheld: false })
    await suspend(ana.id)

    expect(await claim(bea.id, number)).toMatchObject({
      outcome: 'withheld',
      previous_user_id: null,
      lost_on: null,
    })
    expect(await claimOf(bea.id)).toEqual([])
    expect(await numberOf(ana.id)).toBe(number)
  })

  // Covers: US4-AS4
  it('al reactivar, vuelve «en otra cuenta» de siempre, con la prueba', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    await lift(await suspend(ana.id))
    const bea = await people.person(0, 'Bea')

    expect(await verify(bea.id, number)).toMatchObject({ in_use: true, withheld: false })
    expect(await claimOf(bea.id)).toEqual([{ number }])
  })
})

describeDb('el número retenido de una suspendida que borró su cuenta', () => {
  // Covers: US4-AS3, FR-027, FR-028
  it('guarda solo un HMAC del número, no el SHA-256 desnudo, hasta dentro de 12 meses', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    await suspend(ana.id)

    const startedAt = Date.now()
    const retained = await deleteAccount(ana.id)
    expect(retained).toHaveLength(1)
    const [row] = retained
    expect(Object.keys(row ?? {}).sort()).toEqual(['number_hash', 'until'])
    expect(row?.number_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row?.number_hash).not.toBe(createHash('sha256').update(number).digest('hex'))

    const expected = new Date(startedAt)
    expected.setMonth(expected.getMonth() + WITHHELD_MONTHS)
    const until = new Date(row?.until ?? 0).getTime()
    expect(Math.abs(until - expected.getTime())).toBeLessThan(MONTH_MS / 2)
  })

  // Covers: US4-AS3
  it('NO se verifica en una cuenta nueva mientras está vigente; vencido, sí', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    await suspend(ana.id)
    const [row] = await deleteAccount(ana.id)
    const bea = await people.person(0, 'Bea')

    expect(await verify(bea.id, number, 'primero')).toMatchObject({
      verified: false,
      withheld: true,
    })

    await db()
      .from('withheld_numbers')
      .update({ until: new Date(Date.now() - 60_000).toISOString() })
      .eq('number_hash', row?.number_hash ?? '')
    expect(await verify(bea.id, number, 'despues')).toMatchObject({
      verified: true,
      withheld: false,
    })
  })

  it('NO se queda con él una prueba de antes del borrado', async () => {
    const ana = await people.person(1, 'Ana')
    const number = await numberOf(ana.id)
    const bea = await people.person(0, 'Bea')
    expect(await verify(bea.id, number)).toMatchObject({ in_use: true })
    await suspend(ana.id)
    await deleteAccount(ana.id)

    expect(await claim(bea.id, number)).toMatchObject({ outcome: 'withheld' })
    expect(await phoneOf(bea.id)).toBeNull()
  })

  it('no retiene nada si la cuenta no estaba suspendida', async () => {
    const ana = await people.person(1, 'Ana')
    expect(await deleteAccount(ana.id)).toEqual([])
  })

  it('no retiene nada si la suspensión estaba levantada', async () => {
    const ana = await people.person(1, 'Ana')
    await lift(await suspend(ana.id))
    expect(await deleteAccount(ana.id)).toEqual([])
  })

  it('no retiene nada si la suspendida no tenía número verificado', async () => {
    const ana = await people.person(0, 'Ana')
    const reserved = await reserve(ana.id, randomNumber(), { digest: 'a-medias' })
    await settle(reserved.code_id)
    await suspend(ana.id)
    expect(await deleteAccount(ana.id)).toEqual([])
  })

  it('sin la clave de Vault, la cuenta se borra igual y no retiene nada', async () => {
    const ana = await people.person(1, 'Ana')
    await suspend(ana.id)

    renameKey('withheld_number_key', 'withheld_number_key_off')
    try {
      expect(await deleteAccount(ana.id)).toEqual([])
    } finally {
      renameKey('withheld_number_key_off', 'withheld_number_key')
    }
    expect(await accountExists(ana.id)).toBe(false)
  })

  // Covers: FR-027
  it('la purga borra los vencidos y deja los vigentes', async () => {
    const hash = () => createHash('sha256').update(crypto.randomUUID()).digest('hex')
    const [expired, live] = [hash(), hash()]
    await db()
      .from('withheld_numbers')
      .insert([
        { number_hash: expired, until: new Date(Date.now() - 60_000).toISOString() },
        { number_hash: live, until: new Date(Date.now() + 60_000).toISOString() },
      ])

    const { error } = await serviceClient().rpc('purge_withheld_numbers')
    expect(error).toBeNull()

    const left = (await withheldRows()).map((row) => row.number_hash)
    expect(left).not.toContain(expired)
    expect(left).toContain(live)
    await db().from('withheld_numbers').delete().eq('number_hash', live)
  })

  // Covers: FR-028 (privacidad)
  it('NO lo lee nadie desde el cliente: ni sin sesión, ni una persona, ni quien administra', async () => {
    const ana = await people.person(1, 'Ana')
    await suspend(ana.id)
    await deleteAccount(ana.id)
    const [someone, admin] = [await people.person(1), await people.admin()]

    const reads = await Promise.all(
      [anonClient(), someone.client, admin.client].map(async (client) => {
        const { data, error } = await client.from('withheld_numbers').select('number_hash')
        return { data, code: error?.code }
      }),
    )
    expect(reads).toEqual(Array(3).fill({ data: null, code: '42501' }))
  })
})
