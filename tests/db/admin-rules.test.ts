// Las reglas de Administrar en la base (historia #73). Las colas: qué es un pendiente, qué es lo
// propio de quien mira y desde cuándo espera el más viejo; el número del menú; y lo llegado a
// Opiniones y Encuestas en 7 días.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  ancientWindow,
  othersAs,
  pendingIdentity,
  pendingPet,
  pendingReport,
  pendingTotalAs,
  queueCountAs,
  recentCountsAs,
} from './admin-support'
import { makeExpired } from './identity-support'
import { moderationPeople, suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'
import { insertAsOwner, uruguayDay } from './surveys-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)
const feedbackAttempts: string[] = []
const answerBodies: string[] = []

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await db().from('feedback').delete().in('attempt_id', feedbackAttempts.splice(0))
  await db().from('survey_answers').delete().in('body', answerBodies.splice(0))
})

describeDb('las tres colas de quien administra', () => {
  // Covers: US1-AS5, US1-AS6, FR-013, spec §Edge Cases (lo mío nunca atrasa, varias personas)
  it('cada cola cuenta lo de otras y deja lo propio aparte, con el animal y sin el reporte', async () => {
    const lucia = await admin('Lucía')
    const marta = await admin('Marta')
    const bruno = await person(1, 'Bruno')
    const before = { lucia: await othersAs(lucia.client), marta: await othersAs(marta.client) }

    await pendingIdentity(bruno)
    await pendingPet(bruno, 'Luna')
    await pendingReport(lucia, bruno)
    await pendingIdentity(lucia)
    await pendingPet(lucia, 'Tobi')
    await pendingReport(bruno, lucia)

    expect(await othersAs(lucia.client)).toEqual({
      identity: before.lucia.identity + 1,
      pets: before.lucia.pets + 1,
      reports: before.lucia.reports + 1,
    })
    expect(await othersAs(marta.client)).toEqual({
      identity: before.marta.identity + 2,
      pets: before.marta.pets + 2,
      reports: before.marta.reports + 2,
    })

    const own = await Promise.all(
      (['identity', 'pets', 'reports'] as const).map(
        async (queue) => (await queueCountAs(lucia.client, queue)).own,
      ),
    )
    expect(own.map((items) => (Array.isArray(items) ? items.length : -1))).toEqual([1, 1, 1])
    const [identity, pets, reports] = own.map((items) => (Array.isArray(items) ? items[0] : null))
    expect(identity).toEqual({ since: expect.any(String), pet_name: null })
    expect(pets).toEqual({ since: expect.any(String), pet_name: 'Tobi' })
    expect(reports).toEqual({ since: expect.any(String), pet_name: null })
    expect((await queueCountAs(marta.client, 'pets')).own).toEqual([])
  })

  // Covers: spec §Edge Cases (un pedido que vence; una publicación de una cuenta suspendida)
  it('un pedido vencido y la publicación de una cuenta suspendida no cuentan', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const request = await pendingIdentity(bruno)
    await pendingPet(bruno, 'Luna')
    const before = await othersAs(lucia.client)

    await makeExpired(request)
    await suspend(bruno.id)

    expect(await othersAs(lucia.client)).toEqual({
      identity: before.identity - 1,
      pets: before.pets - 1,
      reports: before.reports,
    })
  })

  // Covers: FR-010, FR-013 (la espera es la del más viejo de lo que puedo resolver)
  it('el más viejo es el de lo que puedo resolver, aunque lo mío espere más', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const at = ancientWindow()
    await pendingPet(lucia, 'Tobi', at(0))
    await pendingPet(bruno, 'Luna', at(10))
    await pendingPet(bruno, 'Sol', at(20))
    await pendingIdentity(lucia, at(0))
    await pendingIdentity(bruno, at(30))
    await pendingReport(bruno, lucia, at(0))
    await pendingReport(lucia, bruno, at(40))

    const pets = await queueCountAs(lucia.client, 'pets')
    expect(new Date(pets.oldest).toISOString()).toBe(at(10))
    expect(pets.own).toEqual([{ since: expect.stringMatching(/^1\d{3}-/u), pet_name: 'Tobi' }])
    expect(new Date((await queueCountAs(lucia.client, 'identity')).oldest).toISOString()).toBe(
      at(30),
    )
    expect(new Date((await queueCountAs(lucia.client, 'reports')).oldest).toISOString()).toBe(
      at(40),
    )
  })

  it('lo propio sale del más viejo al más nuevo', async () => {
    const lucia = await admin('Lucía')
    const at = ancientWindow()
    await pendingPet(lucia, 'Nuevo', at(50))
    await pendingPet(lucia, 'Viejo', at(5))

    const { own } = await queueCountAs(lucia.client, 'pets')
    expect(
      Array.isArray(own) ? own.map((item) => Reflect.get(Object(item), 'pet_name')) : [],
    ).toEqual(['Viejo', 'Nuevo'])
  })

  it('una cola que no existe es un error, no una cola vacía', async () => {
    const lucia = await admin('Lucía')
    const { error } = await lucia.client.rpc('admin_queue_count', { p_queue: 'opiniones' })
    expect(error?.code).toBe('22023')
  })

  // Covers: FR-020, US1-AS2, US1-AS7 (el número del menú es la suma de lo que puedo resolver)
  it('el número del menú es la suma de las tres colas, sin lo propio', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    await pendingPet(bruno, 'Luna')
    await pendingPet(lucia, 'Tobi')
    await pendingReport(lucia, bruno)

    const others = await othersAs(lucia.client)
    expect(await pendingTotalAs(lucia.client)).toBe(others.identity + others.pets + others.reports)
  })
})

describeDb('Opiniones y Encuestas en los últimos 7 días', () => {
  // Covers: FR-014, US1-AS8, spec §Edge Cases (hoy y los 6 días anteriores)
  it('cuentan lo llegado hoy y los 6 días anteriores, y no el séptimo', async () => {
    const lucia = await admin('Lucía')
    const before = await recentCountsAs(lucia.client)
    const days = [await uruguayDay(0), await uruguayDay(6), await uruguayDay(7)]
    const attempts = days.map(() => crypto.randomUUID())
    const bodies = days.map(() => `Respuesta ${crypto.randomUUID()}`)
    feedbackAttempts.push(...attempts)
    answerBodies.push(...bodies)

    await insertAsOwner(
      'feedback',
      days.map((day, index) => ({
        body: 'Una opinión',
        screen: 'home',
        sent_on: day,
        attempt_id: attempts[index] ?? '',
      })),
    )
    await insertAsOwner(
      'survey_answers',
      days.map((day, index) => ({
        moment: 'gave',
        option: 'yes',
        body: bodies[index] ?? '',
        answered_on: day,
      })),
    )

    expect(await recentCountsAs(lucia.client)).toEqual({
      feedback: before.feedback + 2,
      survey_answers: before.survey_answers + 2,
    })
  })
})
