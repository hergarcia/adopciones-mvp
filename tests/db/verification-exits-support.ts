// Lo que comparten las pruebas de «¿Qué te frena?» en la base (historia #234): las personas en
// cada punto de la verificación, las llamadas con su sesión y las cuentas leídas con el servicio.
// Las tablas no tienen permisos para nadie más que el servicio.
import { expect } from 'vitest'
import { people } from './identity-support'
import { sql } from './listing-support'
import { suspend } from './moderation-support'
import { db, randomNumber, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export type ExitLevel = 'phone' | 'identity'
export type ExitOrigin = 'publish' | 'apply' | 'self' | 'asked'
export type ExitResult = Functions['answer_verification_exit']['Returns'][number]
export type ExitSummaryRow = Functions['admin_verification_exit_summary']['Returns'][number]
export type ExitTextRow = Functions['admin_verification_exit_texts']['Returns'][number]

export const EXIT_TABLES = [
  'verification_exit_asks',
  'verification_exit_tickets',
  'verification_exit_answers',
  'verification_exit_counts',
] as const

export function exitPeople(cleanups: SyntheticUser['cleanup'][]) {
  const person = people(cleanups)
  return {
    /** Nunca verificó un teléfono, ni tiene uno a medias. */
    noPhone: () => person({ levelOne: false }),
    /** Con un número a medias por primera vez. */
    pendingPhone: async () => {
      const user = await person({ levelOne: false })
      await db()
        .from('phones')
        .insert({
          user_id: user.id,
          pending_number: randomNumber(),
          pending_since: new Date().toISOString(),
        })
        .throwOnError()
      return user
    },
    /** Teléfono verificado (nivel 1), sin la identidad: la de «Ahora no» en el pedido. */
    levelOne: () => person(),
    /** Verificado y cambiándolo: el número nuevo a medias. */
    changingPhone: async () => {
      const user = await person()
      await db()
        .from('phones')
        .update({ pending_number: randomNumber(), pending_since: new Date().toISOString() })
        .eq('user_id', user.id)
        .throwOnError()
      return user
    },
    /** Lo verificó y lo perdió porque otra cuenta se quedó con el número (#25). */
    lostPhone: async () => {
      const user = await person({ levelOne: false })
      await db()
        .from('phones')
        .insert({ user_id: user.id, number_lost_on: new Date().toISOString().slice(0, 10) })
        .throwOnError()
      return user
    },
    /** Con la identidad aprobada. */
    approved: async () => {
      const user = await person()
      await db()
        .from('identity_verifications')
        .insert({ user_id: user.id, verified_on: new Date().toISOString().slice(0, 10) })
        .throwOnError()
      return user
    },
    suspended: async () => {
      const user = await person()
      await suspend(user.id)
      return user
    },
    admin: () => person({ admin: true }),
  }
}

export async function dueAs(client: Client, level: string): Promise<boolean | null> {
  const { data, error } = await client.rpc('verification_exit_due', { p_level: level })
  expect(error).toBeNull()
  return data
}

export async function askAs(client: Client, level: string, origin: string) {
  const { data, error } = await client.rpc('ask_verification_exit', {
    p_level: level,
    p_origin: origin,
  })
  return { ticket: data, error }
}

/** La pregunta hecha: falla si la base no devolvió un ticket. */
export async function askedTicket(client: Client, level: ExitLevel, origin: ExitOrigin) {
  const { ticket, error } = await askAs(client, level, origin)
  expect(error).toBeNull()
  expect(ticket).toEqual(expect.any(String))
  return ticket ?? ''
}

export async function answerAs(
  client: Client,
  ticket: string,
  option: string,
  body: string | null = null,
) {
  const { data, error } = await client.rpc('answer_verification_exit', {
    p_ticket: ticket,
    p_option: option,
    ...(body === null ? {} : { p_body: body }),
  })
  return { result: data?.[0], error }
}

export async function skipAs(client: Client, ticket: string) {
  const { data, error } = await client.rpc('skip_verification_exit', { p_ticket: ticket })
  return { result: data?.[0], error }
}

export async function countsOf(level: ExitLevel, origin: ExitOrigin) {
  const { data } = await db()
    .from('verification_exit_counts')
    .select('asked, skipped')
    .eq('level', level)
    .eq('origin', origin)
    .single()
    .throwOnError()
  return data
}

export async function asksOf(personId: string): Promise<string[]> {
  const { data } = await db()
    .from('verification_exit_asks')
    .select('level')
    .eq('person_id', personId)
    .order('level')
    .throwOnError()
  return data.map((row) => row.level)
}

export async function ticketExists(ticket: string): Promise<boolean> {
  const { count } = await db()
    .from('verification_exit_tickets')
    .select('ticket', { count: 'exact', head: true })
    .eq('ticket', ticket)
    .throwOnError()
  return count === 1
}

/** Cuántas respuestas guardadas llevan exactamente ese texto. */
export async function answersWith(body: string): Promise<number> {
  const { count } = await db()
    .from('verification_exit_answers')
    .select('id', { count: 'exact', head: true })
    .eq('body', body)
    .throwOnError()
  return count ?? 0
}

/** Cuántas respuestas hay de ese nivel, origen y opción. */
export async function answersOf(level: ExitLevel, origin: ExitOrigin, option: string) {
  const { count } = await db()
    .from('verification_exit_answers')
    .select('id', { count: 'exact', head: true })
    .eq('level', level)
    .eq('origin', origin)
    .eq('option', option)
    .throwOnError()
  return count ?? 0
}

export async function summaryAs(client: Client): Promise<ExitSummaryRow[]> {
  const { data, error } = await client.rpc('admin_verification_exit_summary')
  expect(error).toBeNull()
  return data ?? []
}

/** Las cuentas de (nivel, origen) como las lee quien administra, con lo elegido por opción. */
export function originIn(rows: ExitSummaryRow[], level: ExitLevel, origin: ExitOrigin) {
  const own = rows.filter((row) => row.level === level && row.origin === origin)
  return {
    asked: own[0]?.asked ?? -1,
    skipped: own[0]?.skipped ?? -1,
    chosen: Object.fromEntries(own.map((row) => [row.option, row.chosen])),
  }
}

/** Después del último posible: el primer tramo, sin los nulos que los tipos generados no dejan. */
export const FIRST_TEXTS = { on: '9999-12-31', id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' }

export async function textsAs(
  client: Client,
  level: string,
  before: { on: string; id: string },
  limit: number,
): Promise<ExitTextRow[]> {
  const { data, error } = await client.rpc('admin_verification_exit_texts', {
    p_level: level,
    p_before_on: before.on,
    p_before_id: before.id,
    p_limit: limit,
  })
  expect(error).toBeNull()
  return data ?? []
}

/**
 * Respuestas armadas a mano, con el dueño de la base: el check de la opción llama una función
 * privada que ni el servicio puede ejecutar.
 */
export async function insertAnswers(
  rows: {
    id: string
    level: ExitLevel
    option: string
    body: string | null
    answered_on: string
  }[],
) {
  const literal = (value: string | null) =>
    value === null ? 'null' : `'${value.replaceAll("'", "''")}'`
  const values = rows.map(
    (row) =>
      `(${[row.id, row.level, row.option, 'self', row.body, row.answered_on].map(literal).join(', ')})`,
  )
  await sql(
    `insert into public.verification_exit_answers (id, level, option, origin, body, answered_on)
     values ${values.join(', ')}`,
  )
}

export async function deleteAnswers(ids: string[]) {
  if (ids.length === 0) return
  await sql(
    `delete from public.verification_exit_answers where id in (${ids.map((id) => `'${id}'`).join(', ')})`,
  )
}
