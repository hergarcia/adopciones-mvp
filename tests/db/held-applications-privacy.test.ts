// La privacidad de las solicitudes que esperan la identidad (historia #289, FR-017, FR-018,
// SC-003): mientras espera, quien publicó no ve nada en ninguna de sus lecturas ni en sus números,
// quien administra tampoco, nadie lee las tablas directo, las funciones de quien la escribió no
// traen nada ajeno, y se borra con la cuenta.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { recordAs } from './admin-support'
import { inboxAs, petApplicationsAs, publisherViewAs } from './application-responses-support'
import { ANSWERS } from './applications-support'
import {
  heldOf,
  heldPeople,
  heldTableAs,
  hold,
  myHeldAs,
  myHeldOneAs,
  noticesFor,
} from './held-applications-support'
import { sql } from './listing-support'
import { db } from './phone-support'
import { myPetStatsAs } from './publication-stats-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { admin, rescuer, inReview, noRequest } = heldPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function scene() {
  const { publisher, tobi, young } = await rescuer()
  const { subject } = await inReview()
  return { publisher, tobi, young, subject }
}

describeDb('lo que ve quien publicó', () => {
  // Covers: US1-AS2, FR-017, SC-003
  it('ni la bandeja, ni la carpeta del animal, ni la solicitud, ni los números, ni un correo', async () => {
    const { publisher, tobi, subject } = await scene()
    const statsBefore = await myPetStatsAs(publisher.client, tobi.petId)

    const held = await hold(subject, tobi.code)
    const id = held.held_id ?? ''

    const inbox = await inboxAs(publisher.client)
    expect(inbox.error).toBeNull()
    expect(inbox.rows.filter((row) => row.pet_id === tobi.petId)).toEqual([])
    const folder = await petApplicationsAs(publisher.client, tobi.petId)
    expect(folder.error).toBeNull()
    expect(folder.rows).toEqual([])
    expect((await publisherViewAs(publisher.client, id)).rows).toEqual([])
    expect(await myPetStatsAs(publisher.client, tobi.petId)).toEqual(statsBefore)
    expect(await noticesFor([id])).toEqual([])
  })
})

describeDb('lo que ve quien administra', () => {
  // Covers: FR-018 (ni la tabla ni la ficha de la persona cambian)
  it('no lee las tablas y la ficha de quien la escribió no cambia', async () => {
    const { tobi, subject } = await scene()
    const reviewer = await admin()
    const [profile] = await sql<{ public_id: string }>(
      `select public_id from public.profiles where id = '${subject.id}'`,
    )
    const publicId = profile?.public_id ?? ''
    const before = await recordAs(reviewer.client, publicId)

    await hold(subject, tobi.code)

    expect(await recordAs(reviewer.client, publicId)).toEqual(before)
    for (const table of ['held_applications', 'held_application_moments'] as const) {
      // oxlint-disable-next-line no-await-in-loop -- una tabla por vez
      expect((await heldTableAs(reviewer.client, table)).rows).toEqual([])
    }
  })
})

describeDb('las tablas y las funciones', () => {
  // Covers: FR-018, SC-003 (nadie lee directo, tampoco quien la escribió)
  it('ningún rol lee las tablas: visitante, quien la escribió, quien publicó ni otra persona', async () => {
    const { publisher, tobi, subject } = await scene()
    const stranger = await noRequest('Otra')
    await hold(subject, tobi.code)

    for (const client of [anonClient(), subject.client, publisher.client, stranger.client]) {
      for (const table of ['held_applications', 'held_application_moments'] as const) {
        // oxlint-disable-next-line no-await-in-loop -- un rol y una tabla por vez
        const { rows } = await heldTableAs(client, table)
        expect(rows).toEqual([])
      }
    }
  })

  // Covers: FR-018 (nadie la escribe sin pasar por las funciones)
  it('ningún rol la escribe directo', async () => {
    const { publisher, tobi, subject } = await scene()

    for (const client of [anonClient(), subject.client, publisher.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { error } = await client.from('held_applications').insert({
        applicant_id: subject.id,
        pet_id: tobi.petId,
        attempt_id: crypto.randomUUID(),
        answers: ANSWERS,
        pet_name: 'Tobi',
        expires_at: new Date().toISOString(),
      })
      expect(error).not.toBeNull()
    }
    expect(await heldOf(subject.id)).toEqual([])
  })

  // Covers: FR-016, FR-018 (quien la escribió ve la suya, sin respuestas; nadie más)
  it('las lecturas de quien la escribió traen solo lo suyo y nunca las respuestas', async () => {
    const { publisher, tobi, subject } = await scene()
    const stranger = await noRequest('Otra')
    const id = (await hold(subject, tobi.code)).held_id ?? ''

    const mine = await myHeldAs(subject.client)
    expect(mine.rows.map((row) => row.id)).toEqual([id])
    expect(mine.rows[0]).not.toHaveProperty('answers')
    const one = await myHeldOneAs(subject.client, id)
    expect(one.rows).toHaveLength(1)
    expect(one.rows[0]).not.toHaveProperty('answers')

    for (const client of [stranger.client, publisher.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      expect((await myHeldAs(client)).rows).toEqual([])
      // oxlint-disable-next-line no-await-in-loop -- idem
      expect((await myHeldOneAs(client, id)).rows).toEqual([])
    }
    expect((await myHeldAs(anonClient())).error).not.toBeNull()
  })

  // Covers: FR-018 (dejarla, retirarla y tomar los momentos pasan solo por el servidor)
  it('las funciones que escriben no se llaman sin el rol de servicio', async () => {
    const { tobi, subject } = await scene()

    for (const client of [anonClient(), subject.client]) {
      const calls = [
        client.rpc('hold_application', {
          p_applicant: subject.id,
          p_attempt: crypto.randomUUID(),
          p_code: tobi.code,
          p_answers: ANSWERS,
          p_pending_ttl: '7 days',
        }),
        client.rpc('withdraw_held_application', { p_user: subject.id, p_id: crypto.randomUUID() }),
        client.rpc('claim_held_application_moments', { p_limit: 10 }),
        client.rpc('held_applications_tick'),
      ]
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const results = await Promise.all(calls)
      for (const { error } of results) expect(error).not.toBeNull()
    }
    expect(await heldOf(subject.id)).toEqual([])
  })

  // Covers: spec §Edge Cases «Quien solicitó borra su cuenta»
  it('se borra con la cuenta de quien la escribió', async () => {
    const { tobi, subject } = await scene()
    await hold(subject, tobi.code)

    const { error } = await db().auth.admin.deleteUser(subject.id)
    expect(error).toBeNull()
    expect(await heldOf(subject.id)).toEqual([])
  })

  // Covers: FR-038 (los momentos no guardan quién ni qué animal)
  it('los momentos no tienen columnas de persona ni de animal', async () => {
    const columns = await sql<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'held_application_moments'
        order by column_name`,
    )
    expect(columns.map((column) => column.column_name)).toEqual([
      'applicant_level',
      'created_at',
      'id',
      'kind',
      'litter',
      'publisher_level',
      'reason',
    ])
  })
})
