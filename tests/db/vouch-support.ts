// Lo que comparten las pruebas del aval y el perfil público (historia #12): personas sintéticas en
// el nivel que haga falta, las funciones de la base llamadas con permisos de servicio y las reglas
// de rules.ts, y cómo se pone en pausa y se recupera el nivel 2 sin tocar los avales.
import { expect } from 'vitest'
import { countingReceived } from '../../src/lib/vouches/my-vouches'
import type { MyVouch } from '../../src/lib/vouches/types'
import { DB_RULES } from '../../src/lib/verification/rules'
import { db, firstRow, randomNumber, type Functions } from './phone-support'
import { asNewUser, type SyntheticUser } from './roles'

export type Given = Functions['give_vouch']['Returns'][number]
export type PublicRow = Functions['public_profile']['Returns'][number]
export type MyVouchRow = Functions['my_vouches']['Returns'][number]

export const TTL = DB_RULES.p_pending_ttl

/** Una persona con perfil completo, su id público y el nivel pedido. */
export type Person = SyntheticUser & { publicId: string }

export function people(cleanups: SyntheticUser['cleanup'][]) {
  return async function person(level: 0 | 1 | 2 = 2, name = 'Persona de prueba'): Promise<Person> {
    const user = await asNewUser()
    cleanups.push(user.cleanup)
    const { data, error } = await db()
      .from('profiles')
      .insert({ id: user.id, display_name: name, department: 'UY-MO', locality: 'Malvín' })
      .select('public_id')
      .single()
    expect(error).toBeNull()
    if (level >= 1) await giveLevelOne(user.id)
    if (level >= 2) await verifyIdentity(user.id)
    return { ...user, publicId: data?.public_id ?? '' }
  }
}

export async function giveLevelOne(userId: string) {
  const { error } = await db().from('phones').insert({
    user_id: userId,
    verified_number: randomNumber(),
    verified_at: new Date().toISOString(),
  })
  expect(error).toBeNull()
}

export async function verifyIdentity(userId: string, on = '2026-08-14') {
  const { error } = await db()
    .from('identity_verifications')
    .insert({ user_id: userId, verified_on: on })
  expect(error).toBeNull()
}

// Un cambio de número a medias le saca el nivel 1, y con él el 2 (FR-017 de la historia #10).
export async function pauseLevel(userId: string) {
  const { error } = await db()
    .from('phones')
    .update({ pending_number: randomNumber(), pending_since: new Date().toISOString() })
    .eq('user_id', userId)
  expect(error).toBeNull()
}

export async function resumeLevel(userId: string) {
  const { error } = await db()
    .from('phones')
    .update({ pending_number: null, pending_since: null })
    .eq('user_id', userId)
  expect(error).toBeNull()
}

export async function give(voucher: Person, vouchee: Person): Promise<Given> {
  const { data, error } = await db().rpc('give_vouch', {
    p_voucher: voucher.id,
    p_vouchee_public_id: vouchee.publicId,
    p_pending_ttl: TTL,
  })
  expect(error).toBeNull()
  return firstRow(data, 'give_vouch')
}

export async function withdraw(voucher: Person, vouchee: Person): Promise<string> {
  const { data, error } = await db().rpc('withdraw_vouch', {
    p_voucher: voucher.id,
    p_vouchee_public_id: vouchee.publicId,
  })
  expect(error).toBeNull()
  return data ?? ''
}

export async function remove(vouchee: Person, voucher: Person): Promise<string> {
  const { data, error } = await db().rpc('remove_vouch', {
    p_vouchee: vouchee.id,
    p_voucher_public_id: voucher.publicId,
  })
  expect(error).toBeNull()
  return data ?? ''
}

export async function publicProfile(publicId: string): Promise<PublicRow | null> {
  const { data, error } = await db().rpc('public_profile', {
    p_public_id: publicId,
    p_pending_ttl: TTL,
  })
  expect(error).toBeNull()
  return data?.[0] ?? null
}

export async function vouchersOf(person: Person): Promise<string[]> {
  const row = await publicProfile(person.publicId)
  const vouchers: unknown[] = Array.isArray(row?.vouchers) ? row.vouchers : []
  return vouchers.map((voucher) =>
    typeof voucher === 'object' && voucher !== null
      ? String(Reflect.get(voucher, 'public_id'))
      : '',
  )
}

export async function myVouches(person: Person): Promise<MyVouchRow[]> {
  const { data, error } = await db().rpc('my_vouches', { p_user: person.id, p_pending_ttl: TTL })
  expect(error).toBeNull()
  return data ?? []
}

export function toMyVouch(row: MyVouchRow): MyVouch {
  return {
    direction: row.direction === 'given' ? 'given' : 'received',
    otherPublicId: row.other_public_id,
    otherDisplayName: row.other_display_name,
    otherHasPhoto: row.other_has_photo,
    givenOn: row.given_on,
    mineLacksLevelTwo: row.mine_lacks_level_two,
    otherLacksLevelTwo: row.other_lacks_level_two,
  }
}

export async function countingOf(person: Person): Promise<number> {
  return countingReceived((await myVouches(person)).map(toMyVouch))
}

export async function standing(viewer: Person, target: Person) {
  const { data, error } = await db().rpc('vouch_standing', {
    p_viewer: viewer.id,
    p_target_public_id: target.publicId,
  })
  expect(error).toBeNull()
  return firstRow(data, 'vouch_standing')
}

export async function countVouches(
  table: 'vouches' | 'vouch_blocks',
  voucherId: string,
  voucheeId: string,
): Promise<number> {
  const { count, error } = await db()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('voucher_id', voucherId)
    .eq('vouchee_id', voucheeId)
  expect(error).toBeNull()
  return count ?? 0
}
