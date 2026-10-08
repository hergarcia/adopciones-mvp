// El seguimiento a los 30 días en la base (historia #69, research R3): la vuelta horaria pide solo
// las adopciones del sitio en curso cuyo día 30 de Uruguay ya llegó, una sola vez, y deja como no
// pedidas para siempre las que ese día no estaban en condiciones. La base local solo tiene datos
// sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { noticesOf } from './application-responses-support'
import { declineAdoption, markAdopted } from './adoptions-support'
import {
  backdate,
  followUpOfAs,
  followUpPeople,
  followUpRow,
  myOpenFollowUpsAs,
  myPetFollowUpsAs,
  tick,
  unblock,
  uruguayMoment,
  type AdoptedScene,
} from './follow-ups-support'
import { changed } from './lifecycle-support'
import { block, lift, suspend } from './moderation-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { adoptedScene, publisherWithPet } = followUpPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
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
})
