// Lo que comparten las pruebas de la encuesta en la base (historia #71): los desenlaces armados con
// las funciones de las historias #65 y #67, las llamadas como cada sesión y las cuentas leídas con el
// servicio. Las tablas no tienen permisos para nadie más que el servicio.
import { expect } from 'vitest'
import { adoptionPeople, adoptionsOf, markAdopted } from './adoptions-support'
import { petOf, type Person } from './applications-support'
import { sql } from './listing-support'
import { db, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export type SurveyMoment = 'gave' | 'adopted' | 'not_chosen'
export type SurveyRow = Functions['survey_for']['Returns'][number]
export type PetsSurveyRow = Functions['my_pets_survey']['Returns'][number]
export type SummaryRow = Functions['admin_survey_summary']['Returns'][number]
export type AnswerRow = Functions['admin_survey_answers']['Returns'][number]

export const SURVEY_TABLES = [
  'survey_offers',
  'survey_answers',
  'survey_counts',
  'feedback',
  'feedback_quota',
] as const

export function surveyPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = adoptionPeople(cleanups)
  return {
    ...people,
    /** Tobi marcado adoptado eligiendo a Ana: la otra aceptada y la que esperaba quedan cerradas. */
    handedOver: async () => {
      const scene = await people.handoverScene()
      await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
      return scene
    },
    /** Una publicadora que dio por fuera `count` animales, del más viejo al más nuevo. */
    gaveOutside: async (count: number) => {
      const publisher = await people.person(1, 'Quien publica')
      const adoptions: string[] = []
      for (let index = 0; index < count; index += 1) {
        // oxlint-disable-next-line no-await-in-loop
        const pet = await petOf(publisher)
        // oxlint-disable-next-line no-await-in-loop
        await markAdopted(publisher, pet.petId, null)
        // oxlint-disable-next-line no-await-in-loop
        adoptions.push(await currentAdoption(pet.petId))
      }
      return { publisher, adoptions }
    },
  }
}

export async function currentAdoption(petId: string): Promise<string> {
  const row = (await adoptionsOf(petId)).at(-1)
  if (row === undefined) throw new Error('el animal no tiene adopción')
  return row.id
}

export async function surveyForAs(
  person: Person,
  moment: SurveyMoment,
  subject: string,
): Promise<SurveyRow[]> {
  const { data, error } = await person.client.rpc('survey_for', {
    p_moment: moment,
    p_application: subject,
  })
  expect(error).toBeNull()
  return data ?? []
}

/** La oferta pendiente del desenlace; falla si no la hay. */
export async function pendingFor(
  person: Person,
  moment: SurveyMoment,
  subject: string,
): Promise<string> {
  const rows = await surveyForAs(person, moment, subject)
  expect(rows).toHaveLength(1)
  expect(rows[0]?.state).toBe('pending')
  return rows[0]?.offer_id ?? ''
}

export async function myPetsSurveyAs(client: Client): Promise<PetsSurveyRow[]> {
  const { data, error } = await client.rpc('my_pets_survey')
  expect(error).toBeNull()
  return data ?? []
}

export async function answerAs(
  client: Client,
  offer: string,
  option: string,
  body: string | null = null,
) {
  const { data, error } = await client.rpc('answer_survey', {
    p_offer: offer,
    p_option: option,
    ...(body === null ? {} : { p_body: body }),
  })
  return { outcome: data, error }
}

export async function dismissAs(client: Client, offer: string) {
  const { data, error } = await client.rpc('dismiss_survey', { p_offer: offer })
  return { outcome: data, error }
}

/** Las ofertas de una persona, leídas con el servicio, de la más nueva a la más vieja. */
export async function offersOf(personId: string) {
  const { data, error } = await db()
    .from('survey_offers')
    .select('*')
    .eq('person_id', personId)
    .order('offered_on', { ascending: false, nullsFirst: false })
  expect(error).toBeNull()
  return data ?? []
}

export async function countsOf(moment: SurveyMoment) {
  const { data, error } = await db()
    .from('survey_counts')
    .select('offered, dismissed')
    .eq('moment', moment)
    .single()
  expect(error).toBeNull()
  return data ?? { offered: -1, dismissed: -1 }
}

/** Cuántas respuestas guardadas llevan exactamente ese texto. */
export async function answersWith(body: string): Promise<number> {
  const { count, error } = await db()
    .from('survey_answers')
    .select('id', { count: 'exact', head: true })
    .eq('body', body)
  expect(error).toBeNull()
  return count ?? 0
}

/** El día de Uruguay de hace `daysAgo` días, como lo cuenta la base. */
export async function uruguayDay(daysAgo: number): Promise<string> {
  const rows = await sql<{ day: string }>(
    `select (public.uruguay_today() - ${daysAgo})::text as day`,
  )
  return rows[0]?.day ?? ''
}

// Una oferta ya vista de otro desenlace, el día pedido: la regla de los 30 días mira solo el día.
export async function seenOffer(personId: string, offeredOn: string, state = 'answered') {
  const { error } = await db().from('survey_offers').insert({
    person_id: personId,
    moment: 'not_chosen',
    subject_id: crypto.randomUUID(),
    offered_on: offeredOn,
    state,
  })
  expect(error).toBeNull()
}

export async function summaryAs(client: Client): Promise<SummaryRow[]> {
  const { data, error } = await client.rpc('admin_survey_summary')
  expect(error).toBeNull()
  return data ?? []
}

/** Las cuentas de un momento como las lee quien administra, con lo elegido por opción. */
export function momentIn(rows: SummaryRow[], moment: SurveyMoment) {
  const own = rows.filter((row) => row.moment === moment)
  return {
    offered: own[0]?.offered ?? -1,
    answered: own[0]?.answered ?? -1,
    dismissed: own[0]?.dismissed ?? -1,
    chosen: Object.fromEntries(own.map((row) => [row.option, row.chosen])),
  }
}

export async function answersAs(
  client: Client,
  moment: SurveyMoment,
  before: { on: string; id: string },
  limit: number,
): Promise<AnswerRow[]> {
  const { data, error } = await client.rpc('admin_survey_answers', {
    p_moment: moment,
    p_before_on: before.on,
    p_before_id: before.id,
    p_limit: limit,
  })
  expect(error).toBeNull()
  return data ?? []
}

/** Después de la última posible: el primer tramo, sin los nulos que los tipos generados no dejan. */
export const FIRST_PAGE = { on: '9999-12-31', id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' }

function literal(value: string | null): string {
  return value === null ? 'null' : `'${value.replaceAll("'", "''")}'`
}

/**
 * Filas armadas a mano en una tabla de la encuesta o de las opiniones, con el dueño de la base: sus
 * checks llaman funciones privadas que ni el servicio puede ejecutar.
 */
export async function insertAsOwner(
  table: 'survey_answers' | 'feedback',
  rows: Record<string, string | null>[],
) {
  const columns = Object.keys(rows[0] ?? {})
  const values = rows.map(
    (row) => `(${columns.map((column) => literal(row[column] ?? null)).join(', ')})`,
  )
  await sql(`insert into public.${table} (${columns.join(', ')}) values ${values.join(', ')}`)
}
