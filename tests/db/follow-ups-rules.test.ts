// El seguimiento a los 30 días en la base (historia #69, research R3): la vuelta horaria pide solo
// las adopciones del sitio en curso cuyo día 30 de Uruguay ya llegó, una sola vez, y deja como no
// pedidas para siempre las que ese día no estaban en condiciones. Responder: solo quien adoptó, una
// sola vez, con 1 a 3 fotos en espera (R6). La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { noticesOf } from './application-responses-support'
import { adoptionOfAs, adoptionsOf, declineAdoption, markAdopted } from './adoptions-support'
import {
  answer,
  backdate,
  followUpOfAs,
  followUpPeople,
  followUpRow,
  historiesOf,
  myOpenFollowUpsAs,
  myPetFollowUpsAs,
  photoRows,
  purgeQueue,
  scenePublicIds,
  stagedPhotos,
  stagePhoto,
  tick,
  unblock,
  uruguayMoment,
  type AdoptedScene,
} from './follow-ups-support'
import { changed } from './lifecycle-support'
import { block, lift, suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { adoptedScene, publisherWithPet } = followUpPeople(cleanups)

// De a una: borrar a la vez a quien lo dio y a quien adoptó cruza las cascadas de la adopción y del
// seguimiento en orden opuesto, y Postgres corta una por deadlock; la persona quedaría en la base.
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

const DAY_30 = () => uruguayMoment(30, 12, 0)

async function requestNotices(scene: AdoptedScene) {
  const notices = await noticesOf([scene.chosenId])
  return notices.filter((notice) => notice.kind === 'follow_up_requested')
}

async function skippedAs(scene: AdoptedScene) {
  await tick()
  const row = await followUpRow(scene.adoptionId)
  expect(await requestNotices(scene)).toEqual([])
  return { status: row?.status, reason: row?.skip_reason, adopter: row?.adopter_id }
}

describeDb('cuándo se pide (FR-001, FR-003)', () => {
  // Covers: US1-AS1, US1-AS3, FR-001 (el día de Uruguay, no 30 × 24 horas)
  it('29 días no, 30 sí, contados por el día de Uruguay', async () => {
    const late = await adoptedScene(uruguayMoment(30, 23, 50))
    const early = await adoptedScene(uruguayMoment(29, 0, 10))
    await tick()
    expect((await followUpRow(late.adoptionId))?.status).toBe('requested')
    expect(await followUpRow(early.adoptionId)).toBeNull()
  })

  // Covers: US1-AS1, FR-005 (un solo aviso, a quien adoptó, por su solicitud)
  it('el pedido: la fila con quien adoptó y un aviso para ella', async () => {
    const scene = await adoptedScene(DAY_30())
    await tick()
    const row = await followUpRow(scene.adoptionId)
    expect(row).toMatchObject({
      status: 'requested',
      adopter_id: scene.chosen.id,
      skip_reason: null,
      answered_at: null,
      closed_at: null,
    })
    expect(await requestNotices(scene)).toEqual([
      {
        kind: 'follow_up_requested',
        application_id: scene.chosenId,
        recipient_id: scene.chosen.id,
      },
    ])
  })

  // Covers: FR-003 (una vuelta perdida se recupera en la siguiente)
  it('una de 35 días sin pedido se pide en la vuelta siguiente', async () => {
    const scene = await adoptedScene(uruguayMoment(35, 9, 0))
    await tick()
    expect((await followUpRow(scene.adoptionId))?.status).toBe('requested')
  })

  // Covers: US1-AS4, FR-001, FR-003 (nunca dos pedidos para una adopción)
  it('dos vueltas: una fila y un solo aviso', async () => {
    const scene = await adoptedScene(DAY_30())
    await tick()
    const first = await followUpRow(scene.adoptionId)
    await tick()
    expect(await followUpRow(scene.adoptionId)).toEqual(first)
    expect(await requestNotices(scene)).toHaveLength(1)
  })

  // Covers: US1-AS7, FR-004
  it('por fuera del sitio: nada', async () => {
    const { publisher, pet } = await publisherWithPet()
    await markAdopted(publisher, pet.petId, null)
    const adoptionId = await backdate(pet.petId, DAY_30())
    await tick()
    expect(await followUpRow(adoptionId)).toBeNull()
  })
})

describeDb('el pedido a la vista (FR-006)', () => {
  // Covers: US1-AS1, US1-AS2, US1-AS9 (Mis animales, Mi solicitud y Mis solicitudes, sin el correo)
  it('quien lo dio ve el pedido con su día; quien adoptó puede responder y lo ve en su lista', async () => {
    const scene = await adoptedScene(DAY_30())
    await tick()
    const row = await followUpRow(scene.adoptionId)

    const mine = await myPetFollowUpsAs(scene.publisher.client)
    expect(mine.error).toBeNull()
    expect(mine.rows.filter((line) => line.pet_id === scene.pet.petId)).toEqual([
      {
        pet_id: scene.pet.petId,
        application_id: scene.chosenId,
        status: 'requested',
        requested_at: row?.resolved_at,
        answered_at: null,
        adoption_current: true,
      },
    ])

    const open = await myOpenFollowUpsAs(scene.chosen.client)
    expect(open.ids).toEqual([scene.chosenId])

    const adopter = await followUpOfAs(scene.chosen.client, scene.chosenId)
    expect(adopter.rows).toEqual([
      expect.objectContaining({
        side: 'adopter',
        status: 'requested',
        can_answer: true,
        hidden: false,
        photos: [],
      }),
    ])
    const publisher = await followUpOfAs(scene.publisher.client, scene.chosenId)
    expect(publisher.rows).toEqual([
      expect.objectContaining({ side: 'publisher', status: 'requested', can_answer: false }),
    ])
  })

  // Covers: US1-AS3
  it('antes del día 30, nada en ningún lado', async () => {
    const scene = await adoptedScene(uruguayMoment(10, 12, 0))
    await tick()
    const mine = await myPetFollowUpsAs(scene.publisher.client)
    expect(mine.rows.filter((line) => line.pet_id === scene.pet.petId)).toEqual([])
    expect((await myOpenFollowUpsAs(scene.chosen.client)).ids).toEqual([])
    expect((await followUpOfAs(scene.chosen.client, scene.chosenId)).rows).toEqual([])
  })
})

describeDb('cuándo no se pide, y nunca después (FR-002)', () => {
  // Covers: US1-AS5
  it('terminada: volvió a publicarlo', async () => {
    const scene = await adoptedScene(DAY_30())
    await changed(scene.publisher.id, scene.pet.petId, 'republish')
    expect(await skippedAs(scene)).toEqual({ status: 'skipped', reason: 'ended', adopter: null })
  })

  // Covers: US1-AS6
  it('deshecha: «Yo no adopté»', async () => {
    const scene = await adoptedScene(DAY_30())
    expect((await declineAdoption(scene.chosen, scene.chosenId)).outcome).toBe('done')
    expect((await skippedAs(scene)).reason).toBe('declined')
  })

  // Covers: US1-AS6
  it.each(['publisher', 'adopter'] as const)('bloqueo vigente, de %s', async (who) => {
    const scene = await adoptedScene(DAY_30())
    const [blocker, blocked] =
      who === 'publisher' ? [scene.publisher, scene.chosen] : [scene.chosen, scene.publisher]
    await block(blocker.id, blocked.id)
    expect((await skippedAs(scene)).reason).toBe('blocked')
  })

  // Covers: US1-AS6, R4 (desbloquear no borra la marca)
  it('bloqueo levantado antes del día 30: igual no se pide', async () => {
    const scene = await adoptedScene(DAY_30())
    await block(scene.publisher.id, scene.chosen.id)
    await unblock(scene.publisher.id, scene.chosen.id)
    expect((await skippedAs(scene)).reason).toBe('blocked')
  })

  // Covers: US1-AS8 (de cada lado, y tampoco después de reactivar)
  it.each(['publisher', 'adopter'] as const)(
    'suspensión de %s: no se pide, tampoco al reactivarse',
    async (who) => {
      const scene = await adoptedScene(DAY_30())
      const suspended = who === 'publisher' ? scene.publisher : scene.chosen
      const suspension = await suspend(suspended.id)
      expect((await skippedAs(scene)).reason).toBe('suspended')
      await lift(suspension)
      expect(await skippedAs(scene)).toEqual({
        status: 'skipped',
        reason: 'suspended',
        adopter: null,
      })
    },
  )

  // Covers: US1-AS6
  it('la cuenta de quien adoptó se borró', async () => {
    const scene = await adoptedScene(DAY_30())
    await scene.chosen.cleanup()
    expect(await skippedAs(scene)).toEqual({
      status: 'skipped',
      reason: 'account_deleted',
      adopter: null,
    })
  })

  // Covers: FR-060, SC-007 (borrada después del pedido: no vuelve a resolverse ni a medirse)
  it('la cuenta de quien adoptó se borró después del pedido: queda resuelta y medida', async () => {
    const scene = await adoptedScene(DAY_30())
    await tick()
    const asked = await followUpRow(scene.adoptionId)
    expect(asked?.status).toBe('requested')
    await scene.chosen.cleanup()
    await tick()
    const row = await followUpRow(scene.adoptionId)
    expect(row).toMatchObject({
      status: 'skipped',
      skip_reason: 'account_deleted',
      resolved_at: asked?.resolved_at,
    })
    expect(row?.measured_at).not.toBeNull()
    expect(row?.id).not.toBe(asked?.id)
  })
})

async function requested() {
  const scene = await adoptedScene(DAY_30())
  await tick()
  const row = await followUpRow(scene.adoptionId)
  if (row === null) throw new Error('sin pedido')
  return { scene, followUpId: row.id }
}

async function answeredNotices(scene: AdoptedScene) {
  const notices = await noticesOf([scene.chosenId])
  return notices.filter((notice) => notice.kind === 'follow_up_answered')
}

describeDb('responder (FR-010 a FR-017)', () => {
  // Covers: US2-AS1, FR-010, FR-015 (las fotos en orden, el texto y un aviso a quien lo dio)
  it('con 2 fotos y texto: respondido, en orden, y un aviso para quien lo dio', async () => {
    const { scene, followUpId } = await requested()
    const [first, second] = await stagedPhotos(scene.chosen, scene.chosenId, 2)
    const result = await answer(scene.chosen, scene.chosenId, [second, first], '  Duerme bien.  ')
    const row = await followUpRow(scene.adoptionId)
    expect(result).toEqual({
      outcome: 'answered',
      requested_at: row?.resolved_at,
      photo_count: 2,
      has_text: true,
    })
    expect(row).toMatchObject({ status: 'answered', answer_text: 'Duerme bien.' })
    expect(row?.answered_at).not.toBeNull()
    expect(await photoRows(followUpId)).toEqual([
      { id: second, position: 1 },
      { id: first, position: 2 },
    ])
    expect(await answeredNotices(scene)).toEqual([
      {
        kind: 'follow_up_answered',
        application_id: scene.chosenId,
        recipient_id: scene.publisher.id,
      },
    ])
  })

  // Covers: US2-AS3 (el texto es opcional; solo espacios es sin texto)
  it('una foto, con espacios de texto: se manda sin texto', async () => {
    const { scene } = await requested()
    const [photo] = await stagedPhotos(scene.chosen, scene.chosenId, 1)
    expect(await answer(scene.chosen, scene.chosenId, [photo], '   ')).toMatchObject({
      outcome: 'answered',
      photo_count: 1,
      has_text: false,
    })
    expect((await followUpRow(scene.adoptionId))?.answer_text).toBeNull()
  })

  // Covers: US2-AS5, US2-AS9, FR-013 (dos toques, una respuesta, un correo)
  it('dos veces: la segunda es «already» y no escribe nada', async () => {
    const { scene } = await requested()
    const photos = await stagedPhotos(scene.chosen, scene.chosenId, 2)
    await answer(scene.chosen, scene.chosenId, photos, 'Hola')
    const first = await followUpRow(scene.adoptionId)
    expect(await answer(scene.chosen, scene.chosenId, photos, 'Otra')).toEqual({
      outcome: 'already',
      requested_at: first?.resolved_at,
      photo_count: 2,
      has_text: true,
    })
    expect(await followUpRow(scene.adoptionId)).toEqual(first)
    expect(await answeredNotices(scene)).toHaveLength(1)
  })

  // Covers: US2-AS10, FR-011 (solo quien adoptó)
  it('quien lo dio o la otra aceptada: not_found, y nada cambia', async () => {
    const { scene } = await requested()
    const photos = await stagedPhotos(scene.chosen, scene.chosenId, 1)
    for (const who of [scene.publisher, scene.other]) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      expect((await answer(who, scene.chosenId, photos)).outcome).toBe('not_found')
      // oxlint-disable-next-line no-await-in-loop
      expect((await stagePhoto(who, scene.chosenId)).outcome).toBe('not_found')
    }
    expect((await followUpRow(scene.adoptionId))?.status).toBe('requested')
  })

  it('sin pedido todavía: not_found', async () => {
    const scene = await adoptedScene(uruguayMoment(10, 12, 0))
    await tick()
    expect((await stagePhoto(scene.chosen, scene.chosenId)).outcome).toBe('not_found')
    expect((await answer(scene.chosen, scene.chosenId, [crypto.randomUUID()])).outcome).toBe(
      'not_found',
    )
  })

  // Covers: US2-AS7, US2-AS8, FR-010 (de 1 a 3 fotos en espera de este seguimiento, texto ≤ 500)
  it('0 o 4 fotos, una repetida, una ajena o sin subir, o 501 caracteres: invalid', async () => {
    const { scene } = await requested()
    const photos = await stagedPhotos(scene.chosen, scene.chosenId, 4)
    const otherScene = (await requested()).scene
    const [foreign] = await stagedPhotos(otherScene.chosen, otherScene.chosenId, 1)
    const cases: [string[], string | null][] = [
      [[], null],
      [photos, null],
      [[photos[0], photos[0]], null],
      [[photos[0], foreign], null],
      [[crypto.randomUUID()], null],
      [[photos[0]], 'x'.repeat(501)],
    ]
    for (const [ids, text] of cases) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const result = await answer(scene.chosen, scene.chosenId, ids, text)
      expect({ ids, outcome: result.outcome }).toEqual({ ids, outcome: 'invalid' })
    }
    expect((await followUpRow(scene.adoptionId))?.status).toBe('requested')
    expect(
      (await answer(scene.chosen, scene.chosenId, photos.slice(0, 3), 'x'.repeat(500))).outcome,
    ).toBe('answered')
  })

  // Covers: R7 (las que quedaron en espera se descartan y van a la cola de purga)
  it('al responder, las otras en espera se descartan y quedan en la cola', async () => {
    const { scene, followUpId } = await requested()
    const [kept, dropped] = await stagedPhotos(scene.chosen, scene.chosenId, 2)
    await answer(scene.chosen, scene.chosenId, [kept])
    expect(await photoRows(followUpId)).toEqual([{ id: kept, position: 1 }])
    expect(await purgeQueue(followUpId)).toEqual([dropped])
  })

  // Covers: US2-AS11, FR-022 (la suspensión no cierra el pedido)
  it('suspensión de quien adoptó: suspended y el pedido sigue abierto', async () => {
    const { scene } = await requested()
    const photos = await stagedPhotos(scene.chosen, scene.chosenId, 1)
    const suspension = await suspend(scene.chosen.id)
    expect((await answer(scene.chosen, scene.chosenId, photos)).outcome).toBe('suspended')
    expect((await stagePhoto(scene.chosen, scene.chosenId)).outcome).toBe('suspended')
    expect((await followUpRow(scene.adoptionId))?.status).toBe('requested')
    await lift(suspension)
    expect((await answer(scene.chosen, scene.chosenId, photos)).outcome).toBe('answered')
  })

  // Covers: FR-015 (sin aviso a una cuenta suspendida)
  it('suspensión de quien lo dio: responde y no hay aviso', async () => {
    const { scene } = await requested()
    const photos = await stagedPhotos(scene.chosen, scene.chosenId, 1)
    await suspend(scene.publisher.id)
    expect((await answer(scene.chosen, scene.chosenId, photos)).outcome).toBe('answered')
    expect(await answeredNotices(scene)).toEqual([])
  })

  // Covers: US2-AS4, FR-016, FR-017 (el compromiso sigue pendiente; «Yo no adopté» ya no deshace)
  it('responder no cambia el compromiso y después «Yo no adopté» devuelve answered', async () => {
    const { scene } = await requested()
    const before = await adoptionOfAs(scene.chosen.client, scene.chosenId)
    expect(before.rows).toEqual([expect.objectContaining({ follow_up_answered: false })])
    await answer(scene.chosen, scene.chosenId, await stagedPhotos(scene.chosen, scene.chosenId, 1))
    const [adoption] = await adoptionsOf(scene.pet.petId)
    expect(adoption).toMatchObject({ adopter_accepted_at: null, declined_at: null })
    expect((await declineAdoption(scene.chosen, scene.chosenId)).outcome).toBe('answered')
    const [after] = await adoptionsOf(scene.pet.petId)
    expect(after.declined_at).toBeNull()
    const view = await adoptionOfAs(scene.chosen.client, scene.chosenId)
    expect(view.rows).toEqual([
      expect.objectContaining({ follow_up_answered: true, adopter_accepted_at: null }),
    ])
  })

  // Covers: US2-AS6, FR-013 (una respuesta no se edita)
  it('la respuesta no se edita: la base lo rechaza', async () => {
    const { scene } = await requested()
    await answer(scene.chosen, scene.chosenId, await stagedPhotos(scene.chosen, scene.chosenId, 1))
    const { error } = await db()
      .from('follow_ups')
      .update({ answer_text: 'Otra cosa' })
      .eq('adoption_id', scene.adoptionId)
    expect(error?.message).toBe('follow_up_final')
  })

  // Covers: FR-020, FR-021 (un pedido cerrado no se responde ni recibe fotos)
  it.each(['republish', 'decline', 'block'] as const)('cerrado por %s: closed', async (how) => {
    const { scene } = await requested()
    const photos = await stagedPhotos(scene.chosen, scene.chosenId, 1)
    if (how === 'republish') await changed(scene.publisher.id, scene.pet.petId, 'republish')
    if (how === 'decline') await declineAdoption(scene.chosen, scene.chosenId)
    if (how === 'block') await block(scene.publisher.id, scene.chosen.id)
    expect((await answer(scene.chosen, scene.chosenId, photos)).outcome).toBe('closed')
    expect((await stagePhoto(scene.chosen, scene.chosenId)).outcome).toBe('closed')
  })
})

describeDb('las fotos en espera (R6)', () => {
  // Covers: R6 (reintento idempotente)
  it('el mismo id otra vez: staged, una sola fila', async () => {
    const { scene, followUpId } = await requested()
    const first = await stagePhoto(scene.chosen, scene.chosenId)
    expect(first).toMatchObject({ outcome: 'staged', follow_up_id: followUpId })
    const again = await stagePhoto(scene.chosen, scene.chosenId, first.photoId)
    expect(again).toMatchObject({ outcome: 'staged', follow_up_id: followUpId })
    expect(await photoRows(followUpId)).toEqual([{ id: first.photoId, position: null }])
  })

  // Covers: R6 (tope de 9 en espera)
  it('hasta 9 en espera; la décima, limit; reintentar una de las 9 sigue andando', async () => {
    const { scene } = await requested()
    const ids = await stagedPhotos(scene.chosen, scene.chosenId, 9)
    expect((await stagePhoto(scene.chosen, scene.chosenId)).outcome).toBe('limit')
    expect((await stagePhoto(scene.chosen, scene.chosenId, ids[0])).outcome).toBe('staged')
  })

  it('un id de otro seguimiento: not_found', async () => {
    const one = await requested()
    const two = await requested()
    const [photo] = await stagedPhotos(one.scene.chosen, one.scene.chosenId, 1)
    expect((await stagePhoto(two.scene.chosen, two.scene.chosenId, photo)).outcome).toBe(
      'not_found',
    )
  })

  // Covers: R6 (respondido ya no recibe fotos)
  it('respondido: closed', async () => {
    const { scene } = await requested()
    await answer(scene.chosen, scene.chosenId, await stagedPhotos(scene.chosen, scene.chosenId, 1))
    expect((await stagePhoto(scene.chosen, scene.chosenId)).outcome).toBe('closed')
  })
})

describeDb('qué cuenta en el historial (FR-043)', () => {
  const NONE = [{ given: 0, adopted: 0 }]

  // Covers: US3-AS5, FR-023, FR-043 (terminada después de responder: sigue contando)
  it('respondida y después vuelta a publicar: las dos la siguen contando', async () => {
    const scene = await adoptedScene(DAY_30())
    await tick()
    await answer(scene.chosen, scene.chosenId, await stagedPhotos(scene.chosen, scene.chosenId, 1))
    await changed(scene.publisher.id, scene.pet.petId, 'republish')
    expect(await historiesOf(await scenePublicIds(scene))).toEqual({
      publisher: [{ given: 1, adopted: 0 }],
      adopter: [{ given: 0, adopted: 1 }],
    })
  })

  // Covers: US3-AS6, FR-043 (pedida sin responder, y cerrada sin respuesta: no cuentan)
  it('pedida sin responder y después cerrada sin respuesta: no cuenta en ninguna', async () => {
    const scene = await adoptedScene(DAY_30())
    await tick()
    const ids = await scenePublicIds(scene)
    expect((await followUpRow(scene.adoptionId))?.status).toBe('requested')
    expect(await historiesOf(ids)).toEqual({ publisher: NONE, adopter: NONE })
    await block(scene.publisher.id, scene.chosen.id)
    expect((await followUpRow(scene.adoptionId))?.status).toBe('closed')
    expect(await historiesOf(ids)).toEqual({ publisher: NONE, adopter: NONE })
  })

  // Covers: US3-AS3, FR-004 (no pedida, por fuera del sitio o antes del día 30: nada)
  it('antes del día 30: no cuenta', async () => {
    const scene = await adoptedScene(uruguayMoment(10, 12, 0))
    await tick()
    expect(await historiesOf(await scenePublicIds(scene))).toEqual({
      publisher: NONE,
      adopter: NONE,
    })
  })
})

describeDb('el pedido que se cierra (FR-020 a FR-023)', () => {
  // Covers: US4-AS1, US4-AS2, US4-AS4 (cerrado sin respuesta, con su motivo, y fuera de la lista)
  it.each([
    ['republish', 'ended'],
    ['decline', 'declined'],
    ['block', 'blocked'],
  ] as const)('%s: closed con %s y ya no se ofrece', async (how, reason) => {
    const { scene } = await requested()
    if (how === 'republish') await changed(scene.publisher.id, scene.pet.petId, 'republish')
    if (how === 'decline') await declineAdoption(scene.chosen, scene.chosenId)
    if (how === 'block') await block(scene.chosen.id, scene.publisher.id)
    const row = await followUpRow(scene.adoptionId)
    expect(row).toMatchObject({
      status: 'closed',
      close_reason: reason,
      answered_at: null,
      answer_text: null,
    })
    expect(row?.closed_at).not.toBeNull()
    expect((await myOpenFollowUpsAs(scene.chosen.client)).ids).toEqual([])
    expect(
      (await followUpOfAs(scene.chosen.client, scene.chosenId)).rows.map((r) => r.can_answer),
    ).not.toContain(true)
  })

  // Covers: US4-AS1, FR-021 (después de volver a publicar, quien lo dio ve «sin respuesta»)
  it('vuelto a publicar sin respuesta: la pantalla del animal lo sigue mostrando, cerrado', async () => {
    const { scene } = await requested()
    await changed(scene.publisher.id, scene.pet.petId, 'republish')
    const mine = await myPetFollowUpsAs(scene.publisher.client)
    expect(mine.rows.filter((line) => line.pet_id === scene.pet.petId)).toEqual([
      expect.objectContaining({ status: 'closed', answered_at: null, adoption_current: false }),
    ])
    expect((await followUpOfAs(scene.publisher.client, scene.chosenId)).rows).toEqual([
      expect.objectContaining({ side: 'publisher', status: 'closed', can_answer: false }),
    ])
  })

  // Covers: FR-031 (hasta que se adopte otra vez, por fuera del sitio o antes del día 30)
  it('respondido y adoptado otra vez: la pantalla del animal ya no lo muestra', async () => {
    const { scene } = await requested()
    await answer(scene.chosen, scene.chosenId, await stagedPhotos(scene.chosen, scene.chosenId, 1))
    await changed(scene.publisher.id, scene.pet.petId, 'republish')
    const before = await myPetFollowUpsAs(scene.publisher.client)
    expect(before.rows.filter((line) => line.pet_id === scene.pet.petId)).toEqual([
      expect.objectContaining({ status: 'answered', adoption_current: false }),
    ])
    await markAdopted(scene.publisher, scene.pet.petId, null)
    const after = await myPetFollowUpsAs(scene.publisher.client)
    expect(after.rows.filter((line) => line.pet_id === scene.pet.petId)).toEqual([])
  })

  // Covers: R4, edge case «Desbloquear después de un bloqueo» (no se reabre)
  it('desbloquear no lo reabre, ni otra vuelta', async () => {
    const { scene } = await requested()
    await block(scene.publisher.id, scene.chosen.id)
    const closed = await followUpRow(scene.adoptionId)
    await unblock(scene.publisher.id, scene.chosen.id)
    await tick()
    expect(await followUpRow(scene.adoptionId)).toEqual(closed)
    expect(closed?.status).toBe('closed')
    expect((await myOpenFollowUpsAs(scene.chosen.client)).ids).toEqual([])
  })

  // Covers: FR-023 (uno respondido no cambia al terminar ni al bloquear)
  it('respondido: volver a publicar y bloquear no lo cambian', async () => {
    const { scene } = await requested()
    await answer(scene.chosen, scene.chosenId, await stagedPhotos(scene.chosen, scene.chosenId, 1))
    const answered = await followUpRow(scene.adoptionId)
    await changed(scene.publisher.id, scene.pet.petId, 'republish')
    await block(scene.publisher.id, scene.chosen.id)
    expect(await followUpRow(scene.adoptionId)).toEqual(answered)
    expect(answered).toMatchObject({ status: 'answered', closed_at: null, close_reason: null })
  })
})
