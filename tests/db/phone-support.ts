// Lo que comparten las pruebas del teléfono en la base (historias #10 y #25): las funciones
// llamadas con permisos de servicio y con las reglas chicas, y cómo se lee lo que dejaron.
import { createClient } from '@supabase/supabase-js'
import { expect } from 'vitest'
import { requireEnv } from '../../src/lib/env'
import type { Database } from '../../src/lib/supabase/types'
import { serviceClient } from './roles'

export type Functions = Database['public']['Functions']
export type Reservation = Functions['reserve_phone_code']['Returns'][number]
export type Facts = Functions['check_phone_code']['Returns'][number]

// Con los tipos de la base, para leer lo que devuelven las funciones sin afirmar su forma.
export function db() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

export function firstRow<T>(rows: T[] | null, what: string): T {
  const row = rows?.[0]
  if (row === undefined) throw new Error(`${what} no devolvió ninguna fila`)
  return row
}

export function randomNumber(): string {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `+5989${1 + Math.floor(Math.random() * 9)}${digits}`
}

export function randomGroup(): number {
  return Math.floor(Math.random() * 32_768)
}

export type Rules = {
  p_code_ttl: string
  p_min_gap: string
  p_window: string
  p_account_cap: number
  p_number_cap: number
  p_site_cap: number
}

export const RULES: Rules = {
  p_code_ttl: '10 minutes',
  p_min_gap: '0 seconds',
  p_window: '24 hours',
  p_account_cap: 50,
  p_number_cap: 50,
  p_site_cap: 500,
}

export async function reserve(
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

export async function settle(codeId: string, outcome: 'sent' | 'rejected' | 'failed' = 'sent') {
  const { error } = await serviceClient().rpc('settle_phone_code', {
    p_code_id: codeId,
    p_outcome: outcome,
  })
  expect(error).toBeNull()
}

export async function check(userId: string, digest: string, maxAttempts = 5): Promise<Facts> {
  const { data, error } = await db().rpc('check_phone_code', {
    p_user_id: userId,
    p_code_digest: digest,
    p_max_attempts: maxAttempts,
    p_window: '24 hours',
  })
  expect(error).toBeNull()
  return firstRow(data, 'check_phone_code')
}

export async function cancel(userId: string) {
  const { error } = await serviceClient().rpc('cancel_pending_phone', { p_user_id: userId })
  expect(error).toBeNull()
}

export async function phoneOf(userId: string) {
  const { data } = await db()
    .from('phones')
    .select('verified_number, verified_at, pending_number, pending_since, number_lost_on')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

// Intentos equivocados uno detrás del otro, a propósito: en paralelo es otra prueba.
export async function wrongTimes(userId: string, times: number): Promise<void> {
  if (times === 0) return
  await check(userId, 'mal')
  await wrongTimes(userId, times - 1)
}

/** Pide un código que sale y lo confirma: la cuenta queda verificada con ese número. */
export async function verify(userId: string, number: string, digest = `ok-${number}`) {
  const reserved = await reserve(userId, number, { digest })
  await settle(reserved.code_id)
  return check(userId, digest)
}

export async function clearSends() {
  await serviceClient().from('phone_number_sends').delete().gte('id', 0)
}

export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

// Para la purga, el tiempo pasa corriendo las fechas hacia atrás.
export async function ageRequest(userId: string, hours: number): Promise<number | null> {
  const { data } = await db()
    .from('phone_codes')
    .update({ requested_at: hoursAgo(hours), expires_at: hoursAgo(hours) })
    .eq('user_id', userId)
    .select('number_send_id')
  const sendId = data?.[0]?.number_send_id ?? null
  if (sendId !== null) {
    await db()
      .from('phone_number_sends')
      .update({ sent_at: hoursAgo(hours) })
      .eq('id', sendId)
  }
  return sendId
}

export async function agePending(userId: string, days: number) {
  await db()
    .from('phones')
    .update({ pending_since: hoursAgo(days * 24) })
    .eq('user_id', userId)
}

export async function purge() {
  const { error } = await serviceClient().rpc('purge_phone_records', {
    p_window: '24 hours',
    p_pending_ttl: '7 days',
  })
  expect(error).toBeNull()
}

export async function codesOf(userId: string): Promise<number> {
  const { count } = await db()
    .from('phone_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}
