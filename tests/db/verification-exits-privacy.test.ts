// Nadie lee «¿Qué te frena?» por fuera de sus funciones (historia #234, FR-024, FR-025, SC-004,
// research R1, R3). Cada prueba lo intenta como quien no debe: un visitante y una persona con
// sesión que ya contestó. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { sql } from './listing-support'
import { anonClient, type SyntheticUser } from './roles'
import {
  EXIT_TABLES,
  FIRST_TEXTS,
  answerAs,
  askedTicket,
  exitPeople,
  summaryAs,
  textsAs,
} from './verification-exits-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { levelOne, admin } = exitPeople(cleanups)

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

const ROW_OF: Record<(typeof EXIT_TABLES)[number], Record<string, unknown>> = {
  verification_exit_asks: { level: 'identity' },
  verification_exit_tickets: { level: 'identity', origin: 'self' },
  verification_exit_answers: { level: 'identity', option: 'later', origin: 'self' },
  verification_exit_counts: { level: 'identity', origin: 'self' },
}

const CALLS = [
  ['verification_exit_due', { p_level: 'identity' }],
  ['ask_verification_exit', { p_level: 'identity', p_origin: 'self' }],
  ['answer_verification_exit', { p_ticket: crypto.randomUUID(), p_option: 'later', p_body: null }],
  ['skip_verification_exit', { p_ticket: crypto.randomUUID() }],
] as const

const ADMIN_CALLS = [
  ['admin_verification_exit_summary', {}],
  [
    'admin_verification_exit_texts',
    { p_level: 'identity', p_before_on: null, p_before_id: null, p_limit: 50 },
  ],
] as const

describeDb('las tablas no se leen ni se escriben con la API (R1)', () => {
  it.each(EXIT_TABLES)('%s: ni un visitante ni quien contestó', async (table) => {
    const bruno = await levelOne()
    const ticket = await askedTicket(bruno.client, 'identity', 'apply')
    expect((await answerAs(bruno.client, ticket, 'no_id_photos')).result?.outcome).toBe('answered')
    for (const client of [anonClient(), bruno.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const read = await client.from(table).select('*')
      expect(read.error?.code).toBe('42501')
      // oxlint-disable-next-line no-await-in-loop
      const write = await client.from(table).insert(ROW_OF[table])
      expect(write.error?.code).toBe('42501')
    }
  })

  // Covers: FR-025 (ni la persona, ni el animal, ni la hora en una respuesta o una pregunta abierta)
  it('ninguna columna de las respuestas ni de los tickets apunta a una persona', async () => {
    const columns = await sql<{ table_name: string; column_name: string }>(
      `select table_name, column_name from information_schema.columns
        where table_schema = 'public'
          and table_name in ('verification_exit_answers', 'verification_exit_tickets')
        order by table_name, ordinal_position`,
    )
    expect(columns.map((c) => `${c.table_name}.${c.column_name}`)).toEqual([
      'verification_exit_answers.id',
      'verification_exit_answers.level',
      'verification_exit_answers.option',
      'verification_exit_answers.origin',
      'verification_exit_answers.body',
      'verification_exit_answers.answered_on',
      'verification_exit_tickets.ticket',
      'verification_exit_tickets.level',
      'verification_exit_tickets.origin',
    ])
    const foreign = await sql<{ count: number }>(
      `select count(*)::int as count from pg_constraint
        where contype = 'f'
          and conrelid in ('public.verification_exit_answers'::regclass,
                           'public.verification_exit_tickets'::regclass)`,
    )
    expect(foreign[0]?.count).toBe(0)
  })

  // Covers: FR-024 (de la persona, solo que ya se le preguntó: sin el día ni la respuesta)
  it('la marca de la persona no guarda más que el nivel', async () => {
    const columns = await sql<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'verification_exit_asks'
        order by ordinal_position`,
    )
    expect(columns.map((c) => c.column_name)).toEqual(['person_id', 'level'])
  })
})

describeDb('sin sesión no se pregunta ni se contesta (SC-004)', () => {
  it.each(CALLS)('%s: un visitante no puede llamarla', async (name, args) => {
    const { error } = await anonClient().rpc(name, args)
    expect(error?.code).toBe('42501')
  })
})

describeDb('lo de quien administra no responde a nadie más (R8, FR-021, FR-026)', () => {
  it.each(ADMIN_CALLS)('%s: un visitante no puede llamarla', async (name, args) => {
    const { error } = await anonClient().rpc(name, args)
    expect(error?.code).toBe('42501')
  })

  // Covers: US3-AS6, SC-004
  it.each(ADMIN_CALLS)('%s: quien contestó no recibe nada', async (name, args) => {
    const diego = await levelOne()
    const ticket = await askedTicket(diego.client, 'identity', 'self')
    expect((await answerAs(diego.client, ticket, 'other', 'tengo pasaporte')).result?.outcome).toBe(
      'answered',
    )
    const { data, error } = await diego.client.rpc(name, args)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  // Covers: US3-AS1, FR-022 (ni un nombre ni nada que lleve a la persona, tampoco en las columnas)
  it('quien administra lee las 40 combinaciones (dos niveles, cuatro orígenes, cinco opciones) y los textos, sin ninguna columna de persona', async () => {
    const reader = await admin()
    const diego = await levelOne()
    const body = `tengo pasaporte ${crypto.randomUUID()}`
    const ticket = await askedTicket(diego.client, 'identity', 'self')
    expect((await answerAs(diego.client, ticket, 'other', body)).result?.outcome).toBe('answered')

    const rows = await summaryAs(reader.client)
    expect(rows).toHaveLength(40)
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(
      ['asked', 'chosen', 'level', 'option', 'origin', 'skipped'].sort(),
    )
    const [newest] = await textsAs(reader.client, 'identity', FIRST_TEXTS, 1)
    expect(Object.keys(newest ?? {}).sort()).toEqual(['answered_on', 'body', 'id'])
  })
})
