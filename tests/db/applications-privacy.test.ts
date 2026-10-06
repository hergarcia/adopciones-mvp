// La privacidad de una solicitud (historia #63, FR-084, SC-002): quien solicitó la lee con su sesión
// por la tabla y por sus dos funciones; nadie más —otra persona, el publicador, quien administra,
// un visitante— lee ninguna fila por ningún camino. Ninguna lectura de esta historia trae un
// teléfono ni un correo, y las funciones de servicio no se pueden llamar con una sesión.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  ANSWERS,
  PENDING_TTL,
  applicationPeople,
  contextOf,
  detailAs,
  insertApplication,
  mineAs,
  tableAs,
  viewAs,
} from './applications-support'
import { db } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, publisherWithPet } = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function sentApplication() {
  const { publisher, pet } = await publisherWithPet()
  const applicant = await person(1, 'Quien solicita')
  const id = await insertApplication(applicant, pet, publisher)
  return { publisher, pet, applicant, id }
}

async function numberOf(userId: string): Promise<string> {
  const { data } = await db()
    .from('phones')
    .select('verified_number')
    .eq('user_id', userId)
    .single()
  return data?.verified_number ?? ''
}

describeDb('una solicitud la lee solo quien la mandó', () => {
  // Covers: FR-084, FR-070, SC-002 (la cara que debe verse)
  it('quien solicitó la lee por la tabla, por Mis solicitudes y por Mi solicitud', async () => {
    const { applicant, pet, id } = await sentApplication()

    const table = await tableAs(applicant.client)
    expect(table.error).toBeNull()
    expect(table.rows.map((row) => row.id)).toEqual([id])

    const mine = await mineAs(applicant.client)
    expect(mine.error).toBeNull()
    expect(mine.rows).toMatchObject([{ id, status: 'sent', code: pet.code, pet_name: 'Tobi' }])

    const detail = await detailAs(applicant.client, id)
    expect(detail.error).toBeNull()
    expect(detail.rows).toMatchObject([{ id, answers: ANSWERS, publisher_name: 'Quien publica' }])
  })

  // Covers: FR-084, FR-081, SC-002 (la cara que no debe verse)
  it('otra persona, el publicador y quien administra no leen ninguna fila ni sus respuestas', async () => {
    const { publisher, id } = await sentApplication()
    const other = await person(2, 'Otra persona')
    const moderator = await admin()

    for (const viewer of [other, publisher, moderator]) {
      // oxlint-disable-next-line no-await-in-loop -- tres sesiones, de a una
      const [table, mine, detail] = await Promise.all([
        tableAs(viewer.client),
        mineAs(viewer.client),
        detailAs(viewer.client, id),
      ])
      expect(table).toEqual({ rows: [], error: null })
      expect(mine).toEqual({ rows: [], error: null })
      expect(detail).toEqual({ rows: [], error: null })
    }
  })

  // Covers: FR-084, SC-002
  it('un visitante no lee la tabla ni puede llamar a las funciones', async () => {
    const { id } = await sentApplication()
    const anon = anonClient()

    const table = await tableAs(anon)
    expect(table.rows).toEqual([])
    expect((await mineAs(anon)).error).not.toBeNull()
    expect((await detailAs(anon, id)).error).not.toBeNull()
  })

  // Covers: R1 (enviar y leer el contexto pasan por el servidor, con el id de la sesión)
  it('las funciones de servicio no se llaman ni con una sesión ni sin ella', async () => {
    const { applicant, pet } = await sentApplication()
    for (const client of [applicant.client, anonClient()]) {
      // oxlint-disable-next-line no-await-in-loop -- dos clientes, de a uno
      const [submitted, context, attempt] = await Promise.all([
        client.rpc('submit_application', {
          p_applicant: applicant.id,
          p_attempt: crypto.randomUUID(),
          p_code: pet.code,
          p_answers: ANSWERS,
          p_pending_ttl: PENDING_TTL,
        }),
        client.rpc('apply_context', {
          p_applicant: applicant.id,
          p_code: pet.code,
          p_pending_ttl: PENDING_TTL,
        }),
        client.rpc('check_application_attempt', {
          p_applicant: applicant.id,
          p_attempt: crypto.randomUUID(),
        }),
      ])
      expect(submitted.error).not.toBeNull()
      expect(context.error).not.toBeNull()
      expect(attempt.error).not.toBeNull()
    }
  })

  it('nadie escribe la tabla con su token', async () => {
    const { applicant, publisher, pet } = await sentApplication()
    const { error } = await applicant.client.from('applications').insert({
      applicant_id: applicant.id,
      pet_id: pet.petId,
      publisher_id: publisher.id,
      attempt_id: crypto.randomUUID(),
      answers: ANSWERS,
      pet_name: 'Tobi',
    })
    expect(error).not.toBeNull()
  })

  // Covers: FR-033, SC-002 (ningún teléfono ni correo, en ninguna dirección)
  it('ninguna lectura de la historia trae el teléfono o el correo de nadie', async () => {
    const { applicant, publisher, pet, id } = await sentApplication()
    const contacts = [
      applicant.email,
      publisher.email,
      await numberOf(applicant.id),
      await numberOf(publisher.id),
    ]

    const reads = await Promise.all([
      mineAs(applicant.client),
      detailAs(applicant.client, id),
      viewAs(applicant.client, pet.code),
      viewAs(anonClient(), pet.code),
    ])
    const context = await contextOf(applicant, pet.code)
    const text = JSON.stringify([...reads.map((read) => read.rows), context])

    for (const contact of contacts) expect(text).not.toContain(contact)
    expect(text).not.toMatch(/phone|email|verified_number/u)
  })
})

describeDb('pet_application_view: lo que la ficha sabe de solicitar', () => {
  // Covers: FR-001, US1-AS10
  it('sin sesión, el nivel y si recibe, sin solicitud; con sesión, su activa', async () => {
    const { applicant, pet, id } = await sentApplication()

    expect((await viewAs(anonClient(), pet.code)).rows).toEqual([
      { required_level: 1, receives: true, my_active_id: null },
    ])
    expect((await viewAs(applicant.client, pet.code)).rows).toEqual([
      { required_level: 1, receives: true, my_active_id: id },
    ])
  })

  // Covers: FR-001 (la bloqueada ve «Quiero adoptar» como cualquiera)
  it('no mira bloqueos: la bloqueada ve que recibe', async () => {
    const { publisher, pet } = await publisherWithPet()
    const blocked = await person(1)
    const { error } = await db()
      .from('blocks')
      .insert({ blocker_id: publisher.id, blocked_id: blocked.id })
    expect(error).toBeNull()

    expect((await viewAs(blocked.client, pet.code)).rows).toMatchObject([{ receives: true }])
  })

  it('una retirada o cerrada no es la activa', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    await insertApplication(applicant, pet, publisher, { status: 'withdrawn' })

    expect((await viewAs(applicant.client, pet.code)).rows).toMatchObject([{ my_active_id: null }])
  })
})
