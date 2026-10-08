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
  historiesOf,
  historyAs,
  myPetFollowUpsAs,
  petHistoryAs,
  purgeQueue,
  scenePublicIds,
  stagedPhotos,
  tick,
  unblock,
  uruguayMoment,
} from './follow-ups-support'
import { block, suspend } from './moderation-support'
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
        pet_id: scene.pet.petId,
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

const NONE = [{ given: 0, adopted: 0 }]
const GAVE_ONE = [{ given: 1, adopted: 0 }]
const ADOPTED_ONE = [{ given: 0, adopted: 1 }]

async function emptyQueue(followUpId: string) {
  const { error } = await db()
    .from('follow_up_photo_purges')
    .delete()
    .eq('follow_up_id', followUpId)
  expect(error).toBeNull()
}

describeDb('el historial, público y sin nada más que dos números (FR-040 a FR-044)', () => {
  // Covers: US3-AS1, US3-AS2, FR-040, FR-041, FR-042, FR-051 (lo único que se ve afuera)
  it('cualquiera, con o sin sesión, lee solo los dos números de cada una', async () => {
    const { scene } = await answeredScene()
    const ids = await scenePublicIds(scene)
    const readers = [
      ['quien lo dio', scene.publisher.client],
      ['quien adoptó', scene.chosen.client],
      ...(await outsiders(scene.other)),
    ] as const
    for (const [who, client] of readers) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const [publisher, adopter, pet] = await Promise.all([
        historyAs(client, ids.publisher),
        historyAs(client, ids.adopter),
        petHistoryAs(client, scene.pet.code),
      ])
      expect({ who, publisher, adopter, pet }).toEqual({
        who,
        publisher: GAVE_ONE,
        adopter: ADOPTED_ONE,
        pet: GAVE_ONE,
      })
    }
  })

  // Covers: US3-AS3, FR-040 (una cuenta suspendida no muestra perfil; lo que no existe, nada)
  it('una cuenta suspendida, un id o un código que no existen: cero y cero', async () => {
    const { scene } = await answeredScene()
    const ids = await scenePublicIds(scene)
    await suspend(scene.publisher.id)
    await suspend(scene.chosen.id)
    expect(await historiesOf(ids)).toEqual({ publisher: NONE, adopter: NONE })
    expect(await petHistoryAs(anonClient(), scene.pet.code)).toEqual(NONE)
    expect(await historyAs(anonClient(), 'no-existe')).toEqual(NONE)
    expect(await petHistoryAs(anonClient(), 'ZZZZZZ')).toEqual(NONE)
  })

  // Covers: US3-AS7, FR-044, FR-053 (borrar la cuenta de quien adoptó saca la adopción y las fotos)
  it('borrar la cuenta de quien adoptó: deja de contar en las dos y las fotos van a la cola', async () => {
    const { scene, photos, followUpId } = await answeredScene()
    const ids = await scenePublicIds(scene)
    await scene.chosen.cleanup()
    expect((await historiesOf(ids)).publisher).toEqual(NONE)
    expect(await petHistoryAs(anonClient(), scene.pet.code)).toEqual(NONE)
    expect(await followUpRow(scene.adoptionId)).toMatchObject({
      status: 'skipped',
      skip_reason: 'account_deleted',
      adopter_id: null,
      answered_at: null,
      answer_text: null,
    })
    expect((await purgeQueue(followUpId)).toSorted()).toEqual(photos.toSorted())
    await emptyQueue(followUpId)
  })

  // Covers: US3-AS7, FR-044, FR-053 (borrar la cuenta de quien lo dio)
  it('borrar la cuenta de quien lo dio: deja de contar para quien adoptó', async () => {
    const { scene, photos, followUpId } = await answeredScene()
    const ids = await scenePublicIds(scene)
    await scene.publisher.cleanup()
    expect((await historiesOf(ids)).adopter).toEqual(NONE)
    expect((await purgeQueue(followUpId)).toSorted()).toEqual(photos.toSorted())
    await emptyQueue(followUpId)
  })

  // Covers: US3-AS7, FR-044, FR-053 (borrar el animal)
  it('borrar el animal: deja de contar en las dos', async () => {
    const { scene, photos, followUpId } = await answeredScene()
    const ids = await scenePublicIds(scene)
    const removed = await db().from('pets').delete().eq('id', scene.pet.petId)
    expect(removed.error).toBeNull()
    expect(await historiesOf(ids)).toEqual({ publisher: NONE, adopter: NONE })
    expect((await purgeQueue(followUpId)).toSorted()).toEqual(photos.toSorted())
    await emptyQueue(followUpId)
  })
})

describeDb('un bloqueo después de responder (FR-034)', () => {
  // Covers: US4-AS3 (en las dos direcciones y también después de desbloquear)
  it.each([
    ['publisher', false],
    ['adopter', false],
    ['publisher', true],
    ['adopter', true],
  ] as const)(
    'bloquea %s (desbloqueado: %s): quien lo dio solo ve el sello, quien adoptó todo',
    async (who, lifted) => {
      const { scene, photos, followUpId } = await answeredScene()
      const ids = await scenePublicIds(scene)
      const [blocker, blocked] =
        who === 'publisher' ? [scene.publisher, scene.chosen] : [scene.chosen, scene.publisher]
      await block(blocker.id, blocked.id)
      if (lifted) await unblock(blocker.id, blocked.id)

      const publisher = await followUpOfAs(scene.publisher.client, scene.chosenId)
      expect(publisher.rows).toEqual([
        expect.objectContaining({
          follow_up_id: followUpId,
          side: 'publisher',
          status: 'answered',
          answered_at: null,
          answer_text: null,
          photos: [],
          hidden: true,
        }),
      ])
      const mine = await myPetFollowUpsAs(scene.publisher.client)
      expect(mine.rows.filter((line) => line.pet_id === scene.pet.petId)).toEqual([
        expect.objectContaining({ status: 'answered', answered_at: null }),
      ])

      const adopter = await followUpOfAs(scene.chosen.client, scene.chosenId)
      expect(adopter.rows).toEqual([
        expect.objectContaining({
          side: 'adopter',
          status: 'answered',
          answer_text: 'Duerme en el sillón.',
          hidden: false,
          photos: photos.map((id) => expect.objectContaining({ id })),
        }),
      ])
      expect(adopter.rows[0]?.answered_at).not.toBeNull()

      expect(await historiesOf(ids)).toEqual({ publisher: GAVE_ONE, adopter: ADOPTED_ONE })
    },
  )
})
