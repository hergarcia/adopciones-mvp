// La privacidad de la pregunta propia (historia #292, docs/03 §2 y §4): no está en nada público
// —el listado, la ficha, la tarjeta para compartir ni el perfil—, otra persona no la lee de la tabla,
// y la pregunta contestada con su respuesta la leen solo las dos puntas de la solicitud.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { publisherViewAs } from './application-responses-support'
import { detailAs } from './applications-support'
import { publicIdOf, sql } from './listing-support'
import {
  KIRA_ANSWER,
  KIRA_QUESTION,
  LITTER_QUESTION,
  ownQuestionPeople,
  submitOwn,
} from './own-questions-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, rescuer, applicants } = ownQuestionPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']

// Todo lo público que se puede pedir de Kira y de quien la publicó, en un solo texto.
async function publicReadsAs(client: Client, code: string, ownerId: string) {
  const publicId = await publicIdOf(ownerId)
  const reads = await Promise.all([
    client.rpc('listed_pets', { p_limit: 240 }),
    client.rpc('listed_pets', { p_owner_public_id: publicId, p_limit: 240 }),
    client.rpc('pet_by_code', { p_code: code }),
    client.rpc('pet_share_card', { p_code: code }),
  ])
  for (const read of reads) expect(read.error).toBeNull()
  return JSON.stringify(reads.map((read) => read.data))
}

describeDb('la pregunta no es pública', () => {
  // Covers: US1-AS1, FR-003 (la ficha se ve como siempre, sin la pregunta)
  it('sin sesión y con otra persona, nada público la trae', async () => {
    const { publisher, kira } = await rescuer()
    const other = await person(1, 'Sin relación')
    for (const client of [anonClient(), other.client]) {
      // oxlint-disable-next-line no-await-in-loop -- una sesión por vez
      const seen = await publicReadsAs(client, kira.code, publisher.id)
      expect(seen).toContain(kira.code)
      expect(seen).not.toContain(KIRA_QUESTION)
    }
  })

  // Covers: docs/03 §2 (la pregunta es de quien publicó)
  it('otra persona no la lee de la tabla; quien publicó lee la suya', async () => {
    const { publisher, kira } = await rescuer()
    const other = await person(1, 'Sin relación')
    const foreign = await other.client.from('pets').select('own_question').eq('id', kira.petId)
    expect(foreign.error).toBeNull()
    expect(foreign.data).toEqual([])
    const own = await publisher.client.from('pets').select('own_question').eq('id', kira.petId)
    expect(own.data).toEqual([{ own_question: KIRA_QUESTION }])
  })
})

describeDb('la pregunta de una camada no es pública', () => {
  // Covers: US2 (ninguna pantalla pública de la camada ni de sus crías la muestra), FR-003
  it('sin sesión y con otra persona, ni la camada ni sus crías la traen', async () => {
    const { publisher, litter } = await rescuer()
    const other = await person(1, 'Sin relación')
    for (const client of [anonClient(), other.client]) {
      // oxlint-disable-next-line no-await-in-loop -- una sesión por vez
      const reads = await Promise.all([
        client.rpc('litter_by_code', { p_code: litter.code }),
        publicReadsAs(client, litter.young[0].code, publisher.id),
      ])
      expect(reads[0].error).toBeNull()
      const seen = JSON.stringify(reads[0].data) + reads[1]
      expect(seen).toContain(litter.code)
      expect(seen).toContain(litter.young[0].code)
      expect(seen).not.toContain(LITTER_QUESTION)
    }
  })

  // Covers: docs/03 §2 (la pregunta es de quien publicó)
  it('otra persona no la lee de la tabla; quien publicó lee la suya', async () => {
    const { publisher, litter } = await rescuer()
    const other = await person(1, 'Sin relación')
    const read = (client: Client) =>
      client.from('litters').select('own_question').eq('id', litter.litterId)
    const foreign = await read(other.client)
    expect(foreign.error).toBeNull()
    expect(foreign.data).toEqual([])
    expect((await read(publisher.client)).data).toEqual([{ own_question: LITTER_QUESTION }])
  })
})

describeDb('la respuesta la leen solo las dos puntas', () => {
  async function scene() {
    const { publisher, kira } = await rescuer()
    const { lucia } = await applicants()
    const sent = await submitOwn(lucia, kira.code, {
      ownQuestion: KIRA_QUESTION,
      ownAnswer: KIRA_ANSWER,
    })
    return { publisher, lucia, id: sent.application_id ?? '' }
  }

  // Covers: US1-AS2, FR-017
  it('quien solicitó y quien publicó leen la pregunta contestada y la respuesta', async () => {
    const { publisher, lucia, id } = await scene()
    const mine = await detailAs(lucia.client, id)
    expect(mine.error).toBeNull()
    expect(mine.rows[0]).toMatchObject({ own_question: KIRA_QUESTION, own_answer: KIRA_ANSWER })
    const received = await publisherViewAs(publisher.client, id)
    expect(received.error).toBeNull()
    expect(received.rows[0]).toMatchObject({
      own_question: KIRA_QUESTION,
      own_answer: KIRA_ANSWER,
    })
  })

  // Covers: US3-AS1, FR-019 (si hoy pregunta lo sabe solo quien publicó)
  it('quien solicitó no recibe si el animal hoy pregunta', async () => {
    const { publisher, lucia, id } = await scene()
    const mine = await detailAs(lucia.client, id)
    expect(mine.rows[0]).toBeDefined()
    expect(mine.rows[0]).not.toHaveProperty('asks_now')
    const received = await publisherViewAs(publisher.client, id)
    expect(received.rows[0]).toHaveProperty('asks_now', true)
  })

  // Covers: docs/03 §4 (nadie más)
  it('otra persona y quien administra no la leen por ninguna de las dos funciones ni la tabla', async () => {
    const { id } = await scene()
    const other = await person(1, 'Sin relación')
    const boss = await admin()
    for (const client of [other.client, boss.client]) {
      // oxlint-disable-next-line no-await-in-loop -- una sesión por vez
      expect((await detailAs(client, id)).rows).toEqual([])
      // oxlint-disable-next-line no-await-in-loop -- una sesión por vez
      expect((await publisherViewAs(client, id)).rows).toEqual([])
      // oxlint-disable-next-line no-await-in-loop -- una sesión por vez
      const table = await client.from('applications').select('own_answer').eq('id', id)
      expect(table.data ?? []).toEqual([])
    }
  })

  // Covers: docs/03 §7 (quien administra nunca lee respuestas)
  it('ninguna función de administrar devuelve la respuesta propia', async () => {
    // `proargnames` trae también las columnas que devuelve una función `returns table`.
    const rows = await sql<{ name: string }>(
      `select p.proname as name
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname like 'admin\\_%'
          and 'own_answer' = any (coalesce(p.proargnames, '{}'))`,
    )
    expect(rows).toEqual([])
  })
})
