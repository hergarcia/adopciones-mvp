// Las reglas de las solicitudes que esperan la identidad (historia #289): quién puede dejarla
// escrita, qué frena en el mismo orden que mandar una solicitud, el lugar que ocupa, una por animal,
// el reintento que deja una sola y el retiro. Si se rompen, alguien guarda una solicitud que no
// debía o se queda sin lugar sin saber por qué.
import { afterEach, describe, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  ANSWERS,
  applicationsOf,
  contextOf,
  insertApplication,
  petOf,
  submit,
} from './applications-support'
import { accept, contactAs, petApplicationsAs } from './application-responses-support'
import {
  dayOf,
  expireAll,
  makeExpired,
  openRequest,
  resolve,
  withdraw as withdrawIdentity,
} from './identity-support'
import { setState } from './lifecycle-support'
import { block, suspend } from './moderation-support'
import {
  claimExpiryOf,
  claimMoments,
  expireHeld,
  heldOf,
  heldPeople,
  hold,
  insertHeld,
  lastMomentId,
  momentDetailsAfter,
  momentsAfter,
  noticesFor,
  noticesTo,
  tick,
  withdrawHeld,
} from './held-applications-support'
import { db } from './phone-support'
import { serviceClient, type SyntheticUser } from './roles'
import { pauseLevel, resumeLevel, verifyIdentity } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, rescuer, inReview, noRequest, nearCap } = heldPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const DAY = 86_400_000

describeDb('dejarla escrita', () => {
  // Covers: US1-AS1, FR-005, FR-010
  it('con el pedido en revisión queda esperando 14 días, con sus respuestas, sin solicitud', async () => {
    const { publisher, tobi } = await rescuer()
    const { subject } = await inReview()

    const before = Date.now()
    const held = await hold(subject, tobi.code)

    expect(held.outcome).toBe('held')
    const [row] = await heldOf(subject.id)
    expect(row).toMatchObject({
      id: held.held_id,
      pet_id: tobi.petId,
      publisher_id: publisher.id,
      status: 'waiting',
      lapse_reason: null,
      answers: ANSWERS,
      pet_name: 'Tobi',
    })
    const ttl = Date.parse(row?.expires_at ?? '') - Date.parse(row?.written_at ?? '')
    expect(ttl).toBe(14 * DAY)
    expect(Date.parse(row?.written_at ?? '')).toBeGreaterThan(before - 60_000)
    expect(await applicationsOf(subject.id)).toEqual([])
  })

  // Covers: US1-AS3, FR-002, edge case «El pedido se rechaza mientras escribe»
  it('sin pedido, con el pedido vencido, rechazado o retirado: no guarda nada', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const none = await noRequest()
    const expired = await inReview('Vencido')
    await makeExpired(expired.requestId)
    const rejected = await inReview('Rechazado')
    expect((await resolve(rejected.requestId, reviewer.id, 'reject', 'unreadable')).decision).toBe(
      'rejected',
    )
    const withdrawn = await inReview('Retirado')
    await withdrawIdentity(withdrawn.subject.id)

    for (const subject of [none, expired.subject, rejected.subject, withdrawn.subject]) {
      // oxlint-disable-next-line no-await-in-loop -- una persona por vez
      expect((await hold(subject, tobi.code)).outcome).toBe('needs_identity')
      // oxlint-disable-next-line no-await-in-loop -- idem
      expect(await heldOf(subject.id)).toEqual([])
    }
  })

  // Covers: US1-AS8, FR-006
  it('con la identidad ya aprobada la manda como siempre, con su aviso', async () => {
    const { publisher, tobi } = await rescuer()
    const verified = await person(2, 'Ya verificada')

    const held = await hold(verified, tobi.code)

    expect(held.outcome).toBe('sent')
    expect(held.held_id).toBeNull()
    expect(await heldOf(verified.id)).toEqual([])
    const [application] = await applicationsOf(verified.id)
    expect(application?.id).toBe(held.application_id)
    expect(await noticesFor([held.application_id ?? ''])).toEqual([
      { kind: 'new_application', application_id: held.application_id, recipient_id: publisher.id },
    ])
  })

  // Covers: FR-005 (el teléfono, antes que la identidad)
  it('sin el teléfono vigente no guarda nada', async () => {
    const { tobi } = await rescuer()
    const { subject } = await inReview()
    await pauseLevel(subject.id)

    expect((await hold(subject, tobi.code)).outcome).toBe('needs_phone')
    expect(await heldOf(subject.id)).toEqual([])
  })

  // Covers: US1-AS4, FR-010, FR-011
  it('ocupa un lugar: con dos activas y una escrita, ni dejar otra ni mandar a uno de teléfono', async () => {
    const { tobi, pipo, young } = await rescuer()
    const other = await rescuer()
    const { subject } = await inReview()
    await insertApplication(subject, other.pipo, other.publisher)
    await insertApplication(subject, other.tobi, other.publisher)
    expect((await hold(subject, young.code)).outcome).toBe('held')

    expect((await hold(subject, tobi.code)).outcome).toBe('limit')
    expect((await submit(subject, pipo.code)).outcome).toBe('limit')
    const [context] = await contextOf(subject, tobi.code)
    expect(context?.active_count).toBe(3)
    expect(context?.active).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: young.name, held: true })]),
    )
  })

  // Covers: US1-AS5, FR-005
  it('una por animal: dejar otra o mandarla para el mismo animal choca con la que espera', async () => {
    const { tobi } = await rescuer()
    const { subject } = await inReview()
    const first = await hold(subject, tobi.code)

    expect(await hold(subject, tobi.code)).toEqual({
      outcome: 'has_held',
      held_id: first.held_id,
      application_id: null,
    })
    expect((await submit(subject, tobi.code)).outcome).toBe('has_held')
    expect(await heldOf(subject.id)).toHaveLength(1)
  })

  // Covers: US1-AS6
  it('con una mandada para ese animal, la que tiene', async () => {
    const { publisher, tobi } = await rescuer()
    const { subject } = await inReview()
    const id = await insertApplication(subject, tobi, publisher)

    expect(await hold(subject, tobi.code)).toEqual({
      outcome: 'has_active',
      held_id: null,
      application_id: id,
    })
  })

  // Covers: edge case «Un animal ya rechazado»
  it('con una no aceptada para ese animal, no deja otra', async () => {
    const { publisher, tobi } = await rescuer()
    const { subject } = await inReview()
    await insertApplication(subject, tobi, publisher, { status: 'rejected' })

    expect((await hold(subject, tobi.code)).outcome).toBe('rejected')
  })

  // Covers: edge case «El animal deja de recibir mientras escribe»
  it('un animal en pausa o que bloqueó a la persona: no guarda nada', async () => {
    const { publisher, tobi } = await rescuer()
    const paused = await inReview('En pausa')
    const blocked = await inReview('Bloqueada')
    await block(publisher.id, blocked.subject.id)

    expect((await hold(blocked.subject, tobi.code)).outcome).toBe('not_receiving')
    await setState(tobi.petId, 'paused')
    expect((await hold(paused.subject, tobi.code)).outcome).toBe('unavailable')
    expect(await heldOf(paused.subject.id)).toEqual([])
  })

  // Covers: US1-AS7, FR-007
  it('el mismo intento dos veces, también a la vez, deja una sola', async () => {
    const { tobi } = await rescuer()
    const { subject } = await inReview()
    const attempt = crypto.randomUUID()

    const [one, two] = await Promise.all([
      hold(subject, tobi.code, { attempt }),
      hold(subject, tobi.code, { attempt }),
    ])
    const again = await hold(subject, tobi.code, { attempt })

    expect([one.outcome, two.outcome].toSorted()).toEqual(['already', 'held'])
    expect(again).toEqual({ outcome: 'already', held_id: one.held_id, application_id: null })
    expect(await heldOf(subject.id)).toHaveLength(1)
  })

  // Covers: US1-AS10, FR-009
  it('una cría y un animal conviven, y las respuestas propuestas salen de la última escrita', async () => {
    const { tobi, young } = await rescuer()
    const { subject } = await inReview()
    await submit(subject, (await rescuer()).pipo.code, {
      answers: { ...ANSWERS, household: 'Antes, solo.' },
    })
    expect((await hold(subject, tobi.code)).outcome).toBe('held')

    const [context] = await contextOf(subject, young.code)
    expect(context?.last_answers).toEqual(ANSWERS)
    expect((await hold(subject, young.code)).outcome).toBe('held')
    expect(await heldOf(subject.id)).toHaveLength(2)
  })
})

describe('retirarla', () => {
  describeDb('la que espera', () => {
    // Covers: US1-AS9, FR-015, FR-030, FR-031
    it('no sale, pierde las respuestas, libera su lugar y deja volver a escribirla', async () => {
      const { tobi } = await rescuer()
      const { subject } = await inReview()
      const held = await hold(subject, tobi.code)

      expect(await withdrawHeld(subject, held.held_id ?? '')).toEqual({
        outcome: 'withdrawn',
        application_id: null,
      })
      const [row] = await heldOf(subject.id)
      expect(row).toMatchObject({ status: 'lapsed', lapse_reason: 'withdrawn', answers: null })
      const [context] = await contextOf(subject, tobi.code)
      expect(context?.active_count).toBe(0)
      expect(context?.my_held_id).toBeNull()
      expect((await hold(subject, tobi.code)).outcome).toBe('held')
    })

    // Covers: FR-018 (la ajena se ve como inexistente)
    it('la de otra persona no se retira', async () => {
      const { tobi } = await rescuer()
      const { subject } = await inReview()
      const stranger = await noRequest('Otra')
      const held = await hold(subject, tobi.code)

      expect((await withdrawHeld(stranger, held.held_id ?? '')).outcome).toBe('not_found')
      expect((await heldOf(subject.id))[0]?.status).toBe('waiting')
    })

    // Covers: FR-010 (la escrita directo cuenta igual en la puerta)
    it('la puerta la ve por animal', async () => {
      const { publisher, tobi } = await rescuer()
      const { subject } = await inReview()
      const id = await insertHeld(subject, tobi, publisher)

      const [context] = await contextOf(subject, tobi.code)
      expect(context?.my_held_id).toBe(id)
      expect(context?.identity_pending_since).not.toBeNull()
    })
  })
})

describeDb('salir', () => {
  // Covers: US2-AS1, US2-AS2, FR-020, FR-021
  it('la aprobación suelta las dos, como solicitudes nuevas de ese momento, y lo cuenta', async () => {
    const { publisher, tobi, young } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const forTobi = await hold(subject, tobi.code)
    const forYoung = await hold(subject, young.code)
    const attempts = (await heldOf(subject.id)).map((row) => row.attempt_id)

    const before = Date.now()
    const resolved = await resolve(requestId, reviewer.id)

    expect(resolved.decision).toBe('approved')
    expect(resolved.held).toEqual([
      { name: 'Tobi', outcome: 'released', until: null },
      { name: young.name, outcome: 'released', until: null },
    ])
    expect(await heldOf(subject.id)).toEqual([])
    const sent = await applicationsOf(subject.id)
    // Las dos salen en la misma transacción, con el mismo `sent_at`: entre ellas no hay orden.
    const line = (fields: unknown[]) => fields.join(' ')
    expect(
      sent.map((row) => line([row.id, row.attempt_id, row.status, row.publisher_id])).toSorted(),
    ).toEqual(
      [
        line([forTobi.held_id, attempts[0], 'sent', publisher.id]),
        line([forYoung.held_id, attempts[1], 'sent', publisher.id]),
      ].toSorted(),
    )
    for (const row of sent) {
      expect(Date.parse(row.sent_at)).toBeGreaterThan(before - 60_000)
      expect(row.answers).toEqual(ANSWERS)
    }
    const inbox = await petApplicationsAs(publisher.client, tobi.petId)
    expect(inbox.rows.map((row) => [row.id, row.is_new])).toEqual([[forTobi.held_id, true]])
    expect(
      (await noticesFor(sent.map((row) => row.id)))
        .map((notice) => notice.application_id)
        .toSorted(),
    ).toEqual([forTobi.held_id, forYoung.held_id].toSorted())
  })

  // Covers: US2-AS3, FR-021 (la regla del correo de siempre)
  it('si quien publicó ya tiene una nueva sin abrir de ese animal, no le llega otro correo', async () => {
    const { publisher, tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    await insertApplication(await person(2, 'Antes'), tobi, publisher)

    await resolve(requestId, reviewer.id)

    expect((await applicationsOf(subject.id)).map((row) => row.id)).toEqual([held.held_id])
    expect(await noticesFor([held.held_id ?? ''])).toEqual([])
  })

  // Covers: US2-AS4, US2-AS5, FR-022
  it('un animal en pausa: sigue esperando y sale con la tarea el día que vuelve, dentro del plazo', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    await setState(tobi.petId, 'paused')

    const resolved = await resolve(requestId, reviewer.id)

    const [row] = await heldOf(subject.id)
    expect(resolved.held).toEqual([
      { name: 'Tobi', outcome: 'waiting', until: dayOf(new Date(row?.expires_at ?? '')) },
    ])
    expect(row?.status).toBe('waiting')
    expect(await applicationsOf(subject.id)).toEqual([])

    await tick()
    expect((await heldOf(subject.id))[0]?.status).toBe('waiting')

    await setState(tobi.petId, 'available')
    await tick()
    expect(await heldOf(subject.id)).toEqual([])
    expect((await applicationsOf(subject.id)).map((one) => one.id)).toEqual([held.held_id])
  })

  // Covers: US2-AS4 (si no vuelve a tiempo, no sale), FR-030
  it('un animal en pausa que vuelve después del plazo: no sale y pierde las respuestas', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    await setState(tobi.petId, 'paused')
    await resolve(requestId, reviewer.id)
    await expireHeld(held.held_id ?? '')

    await setState(tobi.petId, 'available')
    await tick()

    expect(await heldOf(subject.id)).toEqual([
      expect.objectContaining({ status: 'lapsed', lapse_reason: 'expired', answers: null }),
    ])
    expect(await applicationsOf(subject.id)).toEqual([])
  })

  // Covers: FR-023
  it('la identidad aprobada sin el teléfono vigente no la suelta; la tarea la suelta al confirmarlo', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    await pauseLevel(subject.id)

    const resolved = await resolve(requestId, reviewer.id)

    expect(resolved.held).toEqual([expect.objectContaining({ name: 'Tobi', outcome: 'waiting' })])
    await tick()
    expect((await heldOf(subject.id))[0]?.status).toBe('waiting')

    await resumeLevel(subject.id)
    await tick()
    expect(await heldOf(subject.id)).toEqual([])
    expect((await applicationsOf(subject.id)).map((one) => one.id)).toEqual([held.held_id])
  })

  // Covers: US2-AS7, FR-024
  it('sin la identidad aprobada la tarea no la suelta, aunque quien publicó deje de pedirla', async () => {
    const { tobi } = await rescuer()
    const { subject } = await inReview()
    await hold(subject, tobi.code)
    const { error } = await db().from('pets').update({ required_level: 1 }).eq('id', tobi.petId)
    expect(error).toBeNull()

    await tick()

    expect((await heldOf(subject.id))[0]?.status).toBe('waiting')
    expect(await applicationsOf(subject.id)).toEqual([])
  })

  // Covers: FR-025
  it('aprobar y retirar a la vez deja una sola cosa: la solicitud o el retiro', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    const id = held.held_id ?? ''

    const [, withdrawn] = await Promise.all([
      resolve(requestId, reviewer.id),
      withdrawHeld(subject, id),
    ])

    const outcome = {
      withdrawn,
      sent: (await applicationsOf(subject.id)).map((row) => row.id),
      held: (await heldOf(subject.id)).map((row) => [row.status, row.lapse_reason]),
    }
    expect([
      { withdrawn: { outcome: 'released', application_id: id }, sent: [id], held: [] },
      {
        withdrawn: { outcome: 'withdrawn', application_id: null },
        sent: [],
        held: [['lapsed', 'withdrawn']],
      },
    ]).toContainEqual(outcome)
  })

  // Covers: spec §Casos borde (aprobación y adopción al mismo tiempo)
  it('aprobar y adoptar a la vez deja una sola cosa: la solicitud cerrada o la espera vencida', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)

    await Promise.all([resolve(requestId, reviewer.id), setState(tobi.petId, 'adopted')])

    const outcome = {
      sent: (await applicationsOf(subject.id)).map((row) => [row.id, row.status, row.close_reason]),
      held: (await heldOf(subject.id)).map((row) => [row.status, row.lapse_reason]),
    }
    expect([
      { sent: [[held.held_id, 'closed', 'adopted']], held: [] },
      { sent: [], held: [['lapsed', 'adopted']] },
    ]).toContainEqual(outcome)
  })

  // Covers: research R4 (el compromiso de castración ya no corresponde)
  it('si el animal pasó a castrado mientras esperaba, sale sin el compromiso de castración', async () => {
    const { publisher } = await rescuer()
    const reviewer = await admin()
    const kitten = await petOf(publisher, { name: 'Michi', neutered: false, requiredLevel: 2 })
    const { subject, requestId } = await inReview()
    expect(
      (await hold(subject, kitten.code, { answers: { ...ANSWERS, neuter_commitment: 'yes' } }))
        .outcome,
    ).toBe('held')
    const { error } = await db().from('pets').update({ is_neutered: true }).eq('id', kitten.petId)
    expect(error).toBeNull()

    await resolve(requestId, reviewer.id)

    const [application] = await applicationsOf(subject.id)
    expect(application?.answers).toEqual(ANSWERS)
  })

  // Covers: US2-AS6, FR-019
  it('la que salió se acepta y revela el contacto como cualquier otra', async () => {
    const { publisher, tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    const id = held.held_id ?? ''
    expect(await contactAs(subject.client, id)).toEqual({ rows: [], error: null })

    await resolve(requestId, reviewer.id)
    expect(await contactAs(subject.client, id)).toEqual({ rows: [], error: null })
    expect((await accept(publisher, id)).outcome).toBe('accepted')

    expect((await contactAs(subject.client, id)).rows.map((row) => row.name)).toEqual(['Carla'])
    expect((await contactAs(publisher.client, id)).rows.map((row) => row.name)).toEqual(['Bruno'])
  })
})

describeDb('no salir', () => {
  // Covers: US3-AS1, FR-026, FR-034
  it('el rechazo la deja esperando con su último día, y un pedido nuevo aprobado a tiempo la suelta', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)

    const rejected = await resolve(requestId, reviewer.id, 'reject', 'unreadable')

    const [row] = await heldOf(subject.id)
    expect(rejected.retry_on).toBeNull()
    expect(rejected.held).toEqual([
      { name: 'Tobi', outcome: 'waiting', until: dayOf(new Date(row?.expires_at ?? '')) },
    ])
    expect(row).toMatchObject({ status: 'waiting', answers: ANSWERS })

    expect((await resolve(await openRequest(subject.id), reviewer.id)).decision).toBe('approved')
    expect(await heldOf(subject.id)).toEqual([])
    expect((await applicationsOf(subject.id)).map((one) => one.id)).toEqual([held.held_id])
  })

  // Covers: US3-AS2, FR-026, FR-034
  it('el pedido que vence la deja esperando, el aviso del vencimiento la nombra y un pedido nuevo la suelta', async () => {
    const { tobi } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)

    const expiredAt = await makeExpired(requestId)
    await expireAll()

    const [row] = await heldOf(subject.id)
    expect(row?.status).toBe('waiting')
    expect(await claimExpiryOf(subject.id)).toEqual([
      {
        user_id: subject.id,
        expired_on: dayOf(expiredAt),
        notice_origin: 'profile',
        held: [{ name: 'Tobi', outcome: 'waiting', until: dayOf(new Date(row?.expires_at ?? '')) }],
      },
    ])

    await resolve(await openRequest(subject.id), reviewer.id)
    expect((await applicationsOf(subject.id)).map((one) => one.id)).toEqual([held.held_id])
  })

  // Covers: US3-AS3, US3-AS7, FR-027, FR-028, FR-030, FR-032
  it('pasado el plazo no sale: pierde las respuestas, libera su lugar, anota su momento y no avisa a nadie', async () => {
    const { publisher, tobi, pipo } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const held = await hold(subject, tobi.code)
    await expireHeld(held.held_id ?? '')
    const since = await lastMomentId()

    await tick()

    expect(await heldOf(subject.id)).toEqual([
      expect.objectContaining({ status: 'lapsed', lapse_reason: 'expired', answers: null }),
    ])
    expect(await momentsAfter(since)).toEqual([{ kind: 'lapsed', reason: 'expired' }])
    expect((await contextOf(subject, pipo.code))[0]?.active_count).toBe(0)

    await resolve(requestId, reviewer.id)
    expect(await applicationsOf(subject.id)).toEqual([])
    expect(await noticesTo([subject.id, publisher.id])).toEqual([])
  })

  type Closing = {
    reason: string
    close: (scene: {
      publisher: Awaited<ReturnType<typeof rescuer>>['publisher']
      subject: Awaited<ReturnType<typeof inReview>>['subject']
      petId: string
    }) => Promise<void>
  }

  const closings: [string, Closing][] = [
    ['se adopta', { reason: 'adopted', close: ({ petId }) => setState(petId, 'adopted') }],
    [
      'se da de baja',
      { reason: 'unpublished', close: ({ petId }) => setState(petId, 'taken_down') },
    ],
    [
      'se borra el animal',
      {
        reason: 'unpublished',
        close: async ({ petId }) => {
          const { error } = await db().from('pets').delete().eq('id', petId)
          expect(error).toBeNull()
        },
      },
    ],
    [
      'quien publicó borra su cuenta',
      {
        reason: 'unpublished',
        close: async ({ publisher }) => {
          const { error } = await serviceClient().auth.admin.deleteUser(publisher.id)
          expect(error).toBeNull()
        },
      },
    ],
    [
      'quien publicó la bloquea',
      {
        reason: 'not_receiving',
        close: ({ publisher, subject }) => block(publisher.id, subject.id),
      },
    ],
    [
      'quien solicitó bloquea a quien publicó',
      { reason: 'you_blocked', close: ({ publisher, subject }) => block(subject.id, publisher.id) },
    ],
    [
      'suspenden a quien solicitó',
      { reason: 'suspended', close: async ({ subject }) => void (await suspend(subject.id)) },
    ],
    [
      'suspenden a quien publicó',
      { reason: 'unpublished', close: async ({ publisher }) => void (await suspend(publisher.id)) },
    ],
  ]

  // Covers: US3-AS4, US3-AS5, US3-AS7, FR-027, FR-028, FR-029, FR-030, FR-032, edge cases «Quien
  // solicitó bloquea a quien publicó» y «Quien publicó es suspendido o borra su cuenta»
  it.each(closings)(
    'si %s no sale: su motivo, sin respuestas, sin lugar, con su momento, y la aprobación no la manda',
    async (_, { reason, close }) => {
      const { publisher, tobi } = await rescuer()
      const other = await rescuer()
      const reviewer = await admin()
      const { subject, requestId } = await inReview()
      await hold(subject, tobi.code)
      const since = await lastMomentId()

      await close({ publisher, subject, petId: tobi.petId })

      expect(await heldOf(subject.id)).toEqual([
        expect.objectContaining({
          status: 'lapsed',
          lapse_reason: reason,
          answers: null,
          pet_name: 'Tobi',
        }),
      ])
      expect(await momentsAfter(since)).toEqual([{ kind: 'lapsed', reason }])
      expect((await contextOf(subject, other.pipo.code))[0]?.active_count).toBe(0)

      await resolve(requestId, reviewer.id)
      expect(await applicationsOf(subject.id)).toEqual([])
      expect(await noticesTo([subject.id, publisher.id])).toEqual([])
    },
  )

  // Covers: US3-AS6, FR-027, FR-034
  it('el rechazo que llega al tope las cierra a todas y lo dice', async () => {
    const { tobi, young } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await nearCap()
    await hold(subject, tobi.code)
    await hold(subject, young.code)
    const since = await lastMomentId()

    const rejected = await resolve(requestId, reviewer.id, 'reject', 'unreadable')

    expect(rejected.retry_on).not.toBeNull()
    expect(rejected.held).toEqual([
      { name: 'Tobi', outcome: 'lapsed', until: null },
      { name: young.name, outcome: 'lapsed', until: null },
    ])
    expect(
      (await heldOf(subject.id)).map((row) => [row.status, row.lapse_reason, row.answers]),
    ).toEqual([
      ['lapsed', 'capped', null],
      ['lapsed', 'capped', null],
    ])
    expect(await momentsAfter(since)).toEqual([
      { kind: 'lapsed', reason: 'capped' },
      { kind: 'lapsed', reason: 'capped' },
    ])
    expect((await contextOf(subject, tobi.code))[0]?.active_count).toBe(0)
  })

  // Covers: FR-031, edge case «Una que no salió no frena volver a intentar»
  it('una que no salió no frena volver a dejarla escrita, ni mandarla con la identidad aprobada', async () => {
    const { publisher, tobi } = await rescuer()
    const { subject } = await inReview()
    const first = await hold(subject, tobi.code)
    await expireHeld(first.held_id ?? '')
    await tick()
    expect((await heldOf(subject.id))[0]?.lapse_reason).toBe('expired')

    expect((await hold(subject, tobi.code)).outcome).toBe('held')

    const verified = await noRequest('Verificada después')
    await withdrawHeld(verified, await insertHeld(verified, tobi, publisher))
    await verifyIdentity(verified.id)
    expect((await submit(verified, tobi.code)).outcome).toBe('sent')
  })

  // Covers: edge case «Retirar justo cuando sale», FR-025
  it('retirar la que ya salió dice que salió, con su id; la que ya no salió, que estaba cerrada', async () => {
    const { tobi, young } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const forTobi = await hold(subject, tobi.code)
    const forYoung = await hold(subject, young.code)
    await setState(young.id, 'adopted')

    await resolve(requestId, reviewer.id)

    expect(await withdrawHeld(subject, forTobi.held_id ?? '')).toEqual({
      outcome: 'released',
      application_id: forTobi.held_id,
    })
    expect(await withdrawHeld(subject, forYoung.held_id ?? '')).toEqual({
      outcome: 'closed',
      application_id: null,
    })
  })
})

describeDb('medir', () => {
  // Covers: US4-AS3, US4-AS4, FR-038 (sin persona ni animal: solo los niveles y si es de una camada)
  it('salir y no salir anotan un momento con los niveles de ese instante y la camada', async () => {
    const { tobi, young } = await rescuer()
    const reviewer = await admin()
    const { subject, requestId } = await inReview()
    const other = await inReview('Dani')
    const forOther = await hold(other.subject, tobi.code)
    await hold(subject, tobi.code)
    await hold(subject, young.code)
    const since = await lastMomentId()

    await withdrawHeld(other.subject, forOther.held_id ?? '')
    await resolve(requestId, reviewer.id)

    expect(await momentDetailsAfter(since)).toEqual([
      {
        kind: 'lapsed',
        reason: 'withdrawn',
        applicant_level: 1,
        publisher_level: 1,
        litter: false,
      },
      { kind: 'released', reason: null, applicant_level: 2, publisher_level: 1, litter: false },
      { kind: 'released', reason: null, applicant_level: 2, publisher_level: 1, litter: true },
    ])
  })

  // Covers: US4-AS3, FR-038 (cada momento llega una sola vez a la medición)
  it('tomarlos los devuelve una sola vez, más viejos primero', async () => {
    const { tobi, young } = await rescuer()
    const { subject } = await inReview()
    const forTobi = await hold(subject, tobi.code)
    const forYoung = await hold(subject, young.code)
    await claimMoments()
    await withdrawHeld(subject, forTobi.held_id ?? '')
    await withdrawHeld(subject, forYoung.held_id ?? '')

    const first = await claimMoments(1)
    const second = await claimMoments()

    expect(first).toEqual([
      {
        kind: 'lapsed',
        reason: 'withdrawn',
        applicant_level: 1,
        publisher_level: 1,
        litter: false,
      },
    ])
    expect(second).toEqual([
      { kind: 'lapsed', reason: 'withdrawn', applicant_level: 1, publisher_level: 1, litter: true },
    ])
    expect(await claimMoments()).toEqual([])
  })
})
