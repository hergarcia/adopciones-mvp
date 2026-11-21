// «Dejar de recibir» (historia #265, US3, research R6, R7): el enlace de un correo corta todos los
// avisos de su cuenta y de ninguna otra, sin sesión. Si se rompe, a Bruno le siguen llegando correos
// después de tocarlo, o un enlace corta los avisos de Ana.
import { afterEach, expect, it } from 'vitest'
import { hashLinkToken, newLinkToken } from '../../src/lib/links/link-token'
import { describeDb } from '../setup/env-report'
import { moderationPeople } from './moderation-support'
import { alertFor, alertsOf, claimMail } from './pet-alerts-support'
import { db } from './phone-support'
import { serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = moderationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const DAY_MS = 24 * 60 * 60 * 1000

/** El enlace de un correo de avisos, como lo guarda el envío: solo el hash. */
async function linkFor(userId: string): Promise<string> {
  const hash = hashLinkToken(newLinkToken())
  const { error } = await serviceClient().rpc('create_pet_alert_unsubscribe_link', {
    p_user: userId,
    p_token_hash: hash,
  })
  expect(error).toBeNull()
  return hash
}

async function unsubscribe(hash: string) {
  const { data, error } = await serviceClient().rpc('unsubscribe_pet_alerts', {
    p_token_hash: hash,
  })
  expect(error).toBeNull()
  return data?.[0]
}

async function linkExists(hash: string) {
  const { data, error } = await serviceClient().rpc('pet_alert_unsubscribe_link_exists', {
    p_token_hash: hash,
  })
  expect(error).toBeNull()
  return data
}

async function ageLink(hash: string, days: number) {
  const at = new Date(Date.now() - days * DAY_MS).toISOString()
  const { error } = await db()
    .from('pet_alert_unsubscribe_links')
    .update({ created_at: at })
    .eq('token_hash', hash)
  expect(error).toBeNull()
}

describeDb('el enlace de un correo corta los avisos de su cuenta (FR-026, FR-029)', () => {
  // Covers: US3-AS1, US3-AS5, FR-026, FR-029, SC-005, Edge Cases «Un Dejar de recibir viejo»
  it('borra todos los avisos de la cuenta del enlace y ninguno de otra', async () => {
    const bruno = await person(1, 'Bruno')
    const ana = await person(1, 'Ana')
    await alertFor(bruno.client, { species: ['dog'] })
    const hash = await linkFor(bruno.id)
    // Creado después del correo: también se corta.
    await alertFor(bruno.client, { species: ['cat'] })
    await alertFor(ana.client, { species: ['dog'] })

    expect(await unsubscribe(hash)).toEqual({ outcome: 'done', deleted: 2 })

    expect(await alertsOf(bruno.id)).toEqual([])
    expect(await alertsOf(ana.id)).toHaveLength(1)
  })

  // Covers: US3-AS2, FR-027
  it('la segunda vez confirma igual y no borra nada más', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client)
    const hash = await linkFor(bruno.id)

    expect(await unsubscribe(hash)).toEqual({ outcome: 'done', deleted: 1 })
    expect(await unsubscribe(hash)).toEqual({ outcome: 'done', deleted: 0 })
  })

  // Covers: US3-AS1 (un lector de correo que abre el enlace no corta nada, research R7)
  it('preguntar si el enlace sirve no borra nada', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client)
    const hash = await linkFor(bruno.id)

    expect(await linkExists(hash)).toBe(true)
    expect(await alertsOf(bruno.id)).toHaveLength(1)
  })
})

describeDb('un enlace que no sirve no dice de quién era (FR-028, FR-030)', () => {
  // Covers: US3-AS3, FR-028, FR-030
  it('uno alterado no existe y no corta nada', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client)
    const hash = await linkFor(bruno.id)
    const altered = `${hash.slice(0, -1)}${hash.endsWith('0') ? '1' : '0'}`

    expect(await linkExists(altered)).toBe(false)
    expect(await unsubscribe(altered)).toEqual({ outcome: 'unknown', deleted: 0 })
    expect(await alertsOf(bruno.id)).toHaveLength(1)
  })

  // Covers: US3-AS3, Edge Cases «Borrar la cuenta»
  it('el de una cuenta borrada ya no existe', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client)
    const hash = await linkFor(bruno.id)
    expect((await serviceClient().auth.admin.deleteUser(bruno.id)).error).toBeNull()

    expect(await linkExists(hash)).toBe(false)
    expect(await unsubscribe(hash)).toEqual({ outcome: 'unknown', deleted: 0 })
  })

  // Covers: Edge Cases «Un Dejar de recibir de hace más de seis meses»
  it('a los 180 días deja de servir y la corrida de las 8 lo borra', async () => {
    const bruno = await person(1, 'Bruno')
    await alertFor(bruno.client)
    const recent = await linkFor(bruno.id)
    const old = await linkFor(bruno.id)
    await ageLink(recent, 179)
    await ageLink(old, 181)

    expect(await linkExists(recent)).toBe(true)
    expect(await linkExists(old)).toBe(false)
    expect(await unsubscribe(old)).toEqual({ outcome: 'unknown', deleted: 0 })
    expect(await alertsOf(bruno.id)).toHaveLength(1)

    await claimMail()

    const { data } = await db()
      .from('pet_alert_unsubscribe_links')
      .select('token_hash')
      .eq('user_id', bruno.id)
    expect(data?.map((row) => row.token_hash)).toEqual([recent])
  })
})
