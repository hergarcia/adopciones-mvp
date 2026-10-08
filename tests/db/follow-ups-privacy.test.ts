// Quién lee la respuesta del seguimiento (historia #69, FR-033, research R2): solo las dos personas
// de la adopción. Cada prueba intenta leerla como alguien que no debe verla: un visitante, otra
// persona con sesión, la otra aceptada del mismo animal y quien administra; las tablas y el bucket,
// con cualquier sesión. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  answer,
  followUpOfAs,
  followUpPeople,
  followUpRow,
  stagedPhotos,
  tick,
  uruguayMoment,
} from './follow-ups-support'
import { db } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, adoptedScene } = followUpPeople(cleanups)

// De a una: borrar a la vez a quien lo dio y a quien adoptó cruza las cascadas de la adopción y del
// seguimiento en orden opuesto, y Postgres corta una por deadlock; la persona quedaría en la base.
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

async function answeredScene() {
  const scene = await adoptedScene(uruguayMoment(30, 12, 0))
  await tick()
  const photos = await stagedPhotos(scene.chosen, scene.chosenId, 2)
  await answer(scene.chosen, scene.chosenId, photos, 'Duerme en el sillón.')
  const row = await followUpRow(scene.adoptionId)
  if (row === null) throw new Error('sin seguimiento')
  return { scene, photos, followUpId: row.id }
}

async function outsiders(other: SyntheticUser) {
  return [
    ['un visitante', anonClient()],
    ['otra persona', (await person(1, 'Otra')).client],
    ['la otra aceptada', other.client],
    ['quien administra', (await admin()).client],
  ] as const
}

async function emailRow(applicationId: string, recipient: string) {
  const { data, error } = await db().rpc('follow_up_answered_for_email', {
    p_application: applicationId,
    p_recipient: recipient,
  })
  expect(error).toBeNull()
  return data ?? []
}

describeDb('la respuesta, solo para las dos personas (FR-033)', () => {
  // Covers: US2-AS1, US2-AS2, US2-AS6 (las dos la leen: fotos en orden, texto y fecha)
  it('quien adoptó y quien lo dio leen la respuesta entera', async () => {
    const { scene, photos, followUpId } = await answeredScene()
    for (const [side, client] of [
      ['adopter', scene.chosen.client],
      ['publisher', scene.publisher.client],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const { rows, error } = await followUpOfAs(client, scene.chosenId)
      expect(error).toBeNull()
      expect(rows).toEqual([
        expect.objectContaining({
          follow_up_id: followUpId,
          side,
          status: 'answered',
          answer_text: 'Duerme en el sillón.',
          can_answer: false,
          hidden: false,
          photos: photos.map((id) => expect.objectContaining({ id })),
        }),
      ])
      expect(rows[0]?.answered_at).not.toBeNull()
    }
  })

  // Covers: US2-AS10, FR-033, SC-004
  it('nadie más la lee: ni otra persona, ni la otra aceptada, ni quien administra, ni anon', async () => {
    const { scene } = await answeredScene()
    for (const [who, client] of await outsiders(scene.other)) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const { rows } = await followUpOfAs(client, scene.chosenId)
      expect({ who, rows }).toEqual({ who, rows: [] })
    }
  })

  // Covers: FR-033 (las tablas no se leen con ninguna sesión)
  it('las tablas del seguimiento no se leen con ninguna sesión', async () => {
    const { scene } = await answeredScene()
    const sessions = [
      ['quien adoptó', scene.chosen.client],
      ['quien lo dio', scene.publisher.client],
      ...(await outsiders(scene.other)),
    ] as const
    for (const [who, client] of sessions) {
      for (const table of ['follow_ups', 'follow_up_photos', 'follow_up_photo_purges'] as const) {
        // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
        const { data } = await client.from(table).select('*')
        expect({ who, table, data: data ?? [] }).toEqual({ who, table, data: [] })
      }
    }
  })

  // Covers: FR-033 (el bucket no tiene políticas: ni las dos personas bajan un objeto)
  it('el bucket no se lee ni se escribe con ninguna sesión', async () => {
    const { scene, photos, followUpId } = await answeredScene()
    const path = `${followUpId}/${photos[0]}/card.webp`
    const uploaded = await db()
      .storage.from('follow-up-photos')
      .upload(path, new Blob([new Uint8Array([1])], { type: 'image/webp' }), { upsert: true })
    expect(uploaded.error).toBeNull()
    const sessions = [
      ['quien adoptó', scene.chosen.client],
      ['quien lo dio', scene.publisher.client],
      ...(await outsiders(scene.other)),
    ] as const
    for (const [who, client] of sessions) {
      const bucket = client.storage.from('follow-up-photos')
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const download = await bucket.download(path)
      // oxlint-disable-next-line no-await-in-loop
      const signed = await bucket.createSignedUrl(path, 60)
      // oxlint-disable-next-line no-await-in-loop
      const write = await bucket.upload(`${followUpId}/x/card.webp`, new Blob(['x']))
      expect({
        who,
        download: download.data,
        signed: signed.data,
        wrote: write.error === null,
      }).toEqual({ who, download: null, signed: null, wrote: false })
    }
    await db().storage.from('follow-up-photos').remove([path])
  })
})

describeDb('el correo de la respuesta (R8)', () => {
  // Covers: US2-AS1 (el nombre de hoy y la primera foto, sin el texto)
  it('a quien lo dio: el nombre de quien adoptó, el animal y la primera foto', async () => {
    const { scene, photos, followUpId } = await answeredScene()
    expect(await emailRow(scene.chosenId, scene.publisher.id)).toEqual([
      {
        adopter_name: 'Ana',
        pet_name: 'Tobi',
        pet_sex: expect.any(String),
        follow_up_id: followUpId,
        first_photo_id: photos[0],
      },
    ])
  })

  // Covers: FR-033, FR-034 (nadie más, ni con un bloqueo en el medio)
  it('a cualquier otra persona, o después de un bloqueo: nada', async () => {
    const { scene } = await answeredScene()
    for (const recipient of [scene.chosen.id, scene.other.id, (await person(1, 'Otra')).id]) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      expect(await emailRow(scene.chosenId, recipient)).toEqual([])
    }
    const blocked = await db()
      .from('blocks')
      .insert({ blocker_id: scene.chosen.id, blocked_id: scene.publisher.id })
    expect(blocked.error).toBeNull()
    expect(await emailRow(scene.chosenId, scene.publisher.id)).toEqual([])
  })

  // Covers: R2 (las funciones de escritura y del correo son solo del servicio)
  it('ninguna sesión llama a las funciones del servicio', async () => {
    const { scene } = await answeredScene()
    for (const [who, client] of [
      ['quien adoptó', scene.chosen.client],
      ['quien lo dio', scene.publisher.client],
      ['un visitante', anonClient()],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const email = await client.rpc('follow_up_answered_for_email', {
        p_application: scene.chosenId,
        p_recipient: scene.publisher.id,
      })
      // oxlint-disable-next-line no-await-in-loop
      const answered = await client.rpc('answer_follow_up', {
        p_adopter: scene.chosen.id,
        p_application: scene.chosenId,
        p_photos: [],
        p_text: '',
      })
      expect({ who, email: email.error !== null, answer: answered.error !== null }).toEqual({
        who,
        email: true,
        answer: true,
      })
    }
  })
})
