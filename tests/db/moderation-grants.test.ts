// Los permisos de la historia #13 (plan §Permisos): nadie escribe reportes, bloqueos, suspensiones
// ni números retenidos desde el cliente, las funciones que reciben el id de una persona no las
// llama nadie más que el servidor, y una suspendida no cambia su perfil ni su foto con su token.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { MODERATION_TABLES, moderationPeople, suspend } from './moderation-support'
import { webp } from './pet-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const people = moderationPeople(cleanups)
const person = people.person

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']

// Cada tabla con una columna suya, así el rechazo es el del permiso y no el de una columna que no
// existe.
const COLUMN: Record<(typeof MODERATION_TABLES)[number], string> = {
  account_suspensions: 'reason',
  reports: 'reason',
  blocks: 'created_at',
  withheld_numbers: 'until',
}

async function writesAs(client: Client, table: (typeof MODERATION_TABLES)[number], id: string) {
  const rows: Record<(typeof MODERATION_TABLES)[number], Record<string, string>> = {
    account_suspensions: { user_id: id, reason: 'Motivo' },
    reports: { reporter_id: id, reported_id: id, reason: 'scam' },
    blocks: { blocker_id: id, blocked_id: id },
    withheld_numbers: { number_hash: 'a'.repeat(64), until: new Date().toISOString() },
  }
  const column = COLUMN[table]
  const row: Record<string, string> = rows[table]
  const inserted = await client.from(table).insert([row])
  const updated = await client
    .from(table)
    .update({ [column]: rows[table][column] ?? new Date().toISOString() })
    .not(column, 'is', null)
  const deleted = await client.from(table).delete().not(column, 'is', null)
  return [inserted.error, updated.error, deleted.error].map((error) => error?.code)
}

const DENIED = ['42501', '42501', '42501']

describeDb('los permisos de reportes, bloqueos y suspensiones', () => {
  it('NO escribe en las cuatro tablas nadie sin sesión', async () => {
    const someone = await person(1)
    const errors = await Promise.all(
      MODERATION_TABLES.map(async (table) => [
        table,
        await writesAs(anonClient(), table, someone.id),
      ]),
    )
    expect(errors).toEqual(MODERATION_TABLES.map((table) => [table, DENIED]))
  })

  it('NO escribe en las cuatro tablas una persona con sesión, tampoco sobre sí', async () => {
    const someone = await person(1)
    const errors = await Promise.all(
      MODERATION_TABLES.map(async (table) => [
        table,
        await writesAs(someone.client, table, someone.id),
      ]),
    )
    expect(errors).toEqual(MODERATION_TABLES.map((table) => [table, DENIED]))
  })

  it('NO se puede reportar en nombre de otra persona llamando a la base', async () => {
    const [ana, marta] = [await person(1), await person(1)]
    const args = {
      p_reporter: marta.id,
      p_reported_public_id: ana.publicId,
      p_reason: 'scam',
    }
    const calls = await Promise.all(
      [anonClient(), marta.client].map((client) => client.rpc('create_report', args)),
    )
    expect(calls.map(({ error }) => error?.code)).toEqual(['42501', '42501'])
  })

  it('una suspendida NO actualiza su perfil con su token', async () => {
    const ana = await person(1, 'Ana')
    await suspend(ana.id)

    const { data } = await ana.client
      .from('profiles')
      .update({ display_name: 'Otra' })
      .eq('id', ana.id)
      .select('display_name')
    expect(data ?? []).toEqual([])
  })

  it('una suspendida NO sube una foto de perfil con su token', async () => {
    const ana = await person(1, 'Ana')
    await suspend(ana.id)

    const { error } = await ana.client.storage
      .from('avatars')
      .upload(`${ana.id}/avatar.webp`, webp(), { contentType: 'image/webp', upsert: true })
    expect(error).not.toBeNull()
  })

  it('una persona activa sí actualiza su perfil y su foto: la regla es la suspensión', async () => {
    const ana = await person(1, 'Ana')

    const { data } = await ana.client
      .from('profiles')
      .update({ display_name: 'Ana María' })
      .eq('id', ana.id)
      .select('display_name')
    expect(data).toEqual([{ display_name: 'Ana María' }])
    const { error } = await ana.client.storage
      .from('avatars')
      .upload(`${ana.id}/avatar.webp`, webp(), { contentType: 'image/webp', upsert: true })
    expect(error).toBeNull()
  })

  it('NO se bloquea, desbloquea ni se leen los bloqueos en nombre de otra persona', async () => {
    const [ana, bea] = [await person(1), await person(1)]
    const pair = { p_blocker: ana.id, p_public_id: bea.publicId }
    const calls = await Promise.all(
      [anonClient(), ana.client].flatMap((client) => [
        client.rpc('block_person', pair),
        client.rpc('unblock_person', pair),
        client.rpc('my_blocks', { p_user: ana.id }),
        client.rpc('blocked_profile', { p_viewer: ana.id, p_public_id: bea.publicId }),
        client.rpc('vouch_standing', { p_viewer: ana.id, p_target_public_id: bea.publicId }),
      ]),
    )
    expect(calls.map(({ error }) => error?.code)).toEqual(Array(10).fill('42501'))
  })

  it('NO purga los números retenidos nadie más que la tarea diaria', async () => {
    const someone = await person(1)
    const calls = await Promise.all(
      [anonClient(), someone.client].map((client) => client.rpc('purge_withheld_numbers')),
    )
    expect(calls.map(({ error }) => error?.code)).toEqual(['42501', '42501'])
  })
})
