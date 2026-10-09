// Nadie lee la encuesta ni las opiniones por fuera de sus funciones (historia #71, FR-043, FR-050,
// FR-051, research R1, R4, R8, R12). Cada prueba lo intenta como quien no debe: un visitante, una
// persona con sesión y quien respondió. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { sql } from './listing-support'
import { anonClient, type SyntheticUser } from './roles'
import {
  SURVEY_TABLES,
  answerAs,
  dismissAs,
  offersOf,
  pendingFor,
  surveyForAs,
  surveyPeople,
} from './surveys-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, handedOver } = surveyPeople(cleanups)

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

const ROW_OF: Record<(typeof SURVEY_TABLES)[number], Record<string, unknown>> = {
  survey_offers: { moment: 'gave' },
  survey_answers: { moment: 'gave' },
  survey_counts: { moment: 'gave' },
  feedback: { body: 'hola' },
  feedback_quota: { browser_hash: 'x' },
}

const ADMIN_CALLS = [
  ['admin_feedback', { p_before_on: null, p_before_id: null, p_limit: 50 }],
  ['admin_survey_summary', {}],
  [
    'admin_survey_answers',
    { p_moment: 'adopted', p_before_on: null, p_before_id: null, p_limit: 50 },
  ],
  ['admin_delete_feedback', { p_id: crypto.randomUUID() }],
] as const

describeDb('las tablas no se leen ni se escriben con la API (R1, R4, R8)', () => {
  it.each(SURVEY_TABLES)('%s: ni un visitante ni una sesión', async (table) => {
    const someone = await person(1, 'Alguien')
    for (const client of [anonClient(), someone.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const read = await client.from(table).select('*')
      expect(read.error?.code).toBe('42501')
      // oxlint-disable-next-line no-await-in-loop
      const write = await client.from(table).insert(ROW_OF[table])
      expect(write.error?.code).toBe('42501')
    }
  })

  // Covers: FR-051 (ni la persona ni el navegador en una respuesta o una opinión)
  it('ninguna columna de las respuestas ni de las opiniones apunta a una persona', async () => {
    const columns = await sql<{ table_name: string; column_name: string }>(
      `select table_name, column_name from information_schema.columns
        where table_schema = 'public' and table_name in ('survey_answers', 'feedback')
        order by table_name, ordinal_position`,
    )
    expect(columns.map((c) => `${c.table_name}.${c.column_name}`)).toEqual([
      'feedback.id',
      'feedback.body',
      'feedback.screen',
      'feedback.subject',
      'feedback.sent_on',
      'feedback.attempt_id',
      'survey_answers.id',
      'survey_answers.moment',
      'survey_answers.option',
      'survey_answers.body',
      'survey_answers.answered_on',
    ])
    const foreign = await sql<{ count: number }>(
      `select count(*)::int as count from pg_constraint
        where contype = 'f'
          and conrelid in ('public.survey_answers'::regclass, 'public.feedback'::regclass)`,
    )
    expect(foreign[0]?.count).toBe(0)
  })
})

describeDb('lo de quien administra no responde a nadie más (R12)', () => {
  it.each(ADMIN_CALLS)('%s: un visitante no puede llamarla', async (name, args) => {
    const { error } = await anonClient().rpc(name, args)
    expect(error?.code).toBe('42501')
  })

  it.each(ADMIN_CALLS)('%s: una persona y quien respondió no reciben nada', async (name, args) => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    expect((await answerAs(tobi.chosen.client, offer, 'yes', 'valió la pena')).outcome).toBe(
      'answered',
    )
    for (const who of [tobi.publisher, tobi.chosen]) {
      // oxlint-disable-next-line no-await-in-loop
      const { data, error } = await who.client.rpc(name, args)
      expect(error).toBeNull()
      expect(data).toEqual(name === 'admin_delete_feedback' ? 'not_found' : [])
    }
  })
})

describeDb('la oferta de otra persona (R7)', () => {
  it('ni se ve, ni se responde, ni se cierra', async () => {
    const tobi = await handedOver()
    const offer = await pendingFor(tobi.chosen, 'adopted', tobi.chosenId)
    expect(await surveyForAs(tobi.other, 'adopted', tobi.chosenId)).toEqual([])
    expect((await answerAs(tobi.other.client, offer, 'yes')).outcome).toBe('not_found')
    expect((await dismissAs(tobi.other.client, offer)).outcome).toBe('not_found')
    expect((await answerAs(anonClient(), offer, 'yes')).error?.code).toBe('42501')
    expect((await offersOf(tobi.chosen.id))[0]?.state).toBe('pending')
  })
})
