// Lo que comparten las pruebas de la verificación de identidad en la base (historia #11): las
// funciones llamadas con permisos de servicio y las reglas de rules.ts, cómo se arma una persona en
// nivel 1 o que administra, y cómo se lee lo que quedó.
import { expect } from 'vitest'
import { uruguayDay, addDays } from '../../src/lib/verification/identity-status'
import { IDENTITY_DB_RULES } from '../../src/lib/verification/rules'
import { db, firstRow, randomNumber, type Functions } from './phone-support'
import { asNewUser, type SyntheticUser } from './roles'

export type Submitted = Functions['submit_identity_request']['Returns'][number]
export type Withdrawn = Functions['withdraw_identity_request']['Returns'][number]
export type Resolved = Functions['resolve_identity_request']['Returns'][number]

// Un WebP mínimo en base64: la base guarda lo que le llega; la firma la mira el schema.
export const FRONT = Buffer.from('RIFF\0\0\0\0WEBPfrente').toString('base64')
export const SELFIE = Buffer.from('RIFF\0\0\0\0WEBPselfie').toString('base64')

export const NEW_TABLES = [
  'admins',
  'identity_requests',
  'identity_request_images',
  'identity_verifications',
  'identity_rejections',
  'identity_expirations',
  'identity_resolutions',
] as const

export function people(cleanups: SyntheticUser['cleanup'][]) {
  return async function person(
    options: { levelOne?: boolean; admin?: boolean } = {},
  ): Promise<SyntheticUser> {
    const user = await asNewUser()
    cleanups.push(user.cleanup)
    if (options.levelOne ?? true) await giveLevelOne(user.id)
    if (options.admin) await makeAdmin(user.id)
    await db().from('profiles').insert({
      id: user.id,
      display_name: 'Persona de prueba',
      department: 'UY-MO',
      locality: 'Malvín',
    })
    return user
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

export async function makeAdmin(userId: string) {
  const { error } = await db().from('admins').insert({ user_id: userId })
  expect(error).toBeNull()
}

export async function submit(userId: string): Promise<Submitted> {
  const { data, error } = await db().rpc('submit_identity_request', {
    p_user_id: userId,
    p_origin: 'profile',
    p_front: FRONT,
    p_selfie: SELFIE,
    ...IDENTITY_DB_RULES,
  })
  expect(error).toBeNull()
  return firstRow(data, 'submit_identity_request')
}

export async function withdraw(userId: string): Promise<Withdrawn> {
  const { data, error } = await db().rpc('withdraw_identity_request', { p_user_id: userId })
  expect(error).toBeNull()
  return firstRow(data, 'withdraw_identity_request')
}

export async function resolve(
  requestId: string,
  adminId: string,
  outcome: 'approve' | 'reject' = 'approve',
  reason?: string,
): Promise<Resolved> {
  const { data, error } = await db().rpc('resolve_identity_request', {
    p_request_id: requestId,
    p_admin: adminId,
    p_outcome: outcome,
    p_window_days: IDENTITY_DB_RULES.p_window_days,
    p_cap: IDENTITY_DB_RULES.p_cap,
    p_pending_ttl: IDENTITY_DB_RULES.p_pending_ttl,
    ...(reason === undefined ? {} : { p_reason: reason }),
  })
  expect(error).toBeNull()
  return firstRow(data, 'resolve_identity_request')
}

export async function expireAll(): Promise<number> {
  const { data, error } = await db().rpc('expire_identity_requests', {
    p_window_days: IDENTITY_DB_RULES.p_window_days,
    p_notice_days: 1,
  })
  expect(error).toBeNull()
  return data ?? 0
}

/** Un pedido en revisión con sus dos imágenes; devuelve su id. */
export async function openRequest(userId: string): Promise<string> {
  const sent = await submit(userId)
  expect(sent.decision).toBe('sent')
  if (sent.request_id === null) throw new Error('submit no devolvió el id del pedido')
  return sent.request_id
}

// El tiempo pasa corriendo las fechas hacia atrás.
export async function makeExpired(requestId: string) {
  await db()
    .from('identity_requests')
    .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
    .eq('id', requestId)
}

export const today = () => uruguayDay(new Date())
export const daysAgo = (days: number) => addDays(today(), -days)

export async function addRejections(userId: string, ...agesInDays: number[]) {
  const { error } = await db()
    .from('identity_rejections')
    .insert(
      agesInDays.map((age) => ({
        user_id: userId,
        rejected_on: daysAgo(age),
        reason: 'unreadable',
      })),
    )
  expect(error).toBeNull()
}

export async function countRows(
  table: (typeof NEW_TABLES)[number],
  column: string,
  value: string,
): Promise<number> {
  const { count, error } = await db()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value)
  expect(error).toBeNull()
  return count ?? 0
}

export async function imagesOf(requestId: string): Promise<number> {
  return countRows('identity_request_images', 'request_id', requestId)
}
