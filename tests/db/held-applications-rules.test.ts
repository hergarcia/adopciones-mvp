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
  submit,
} from './applications-support'
import { makeExpired, resolve, withdraw as withdrawIdentity } from './identity-support'
import { setState } from './lifecycle-support'
import { block } from './moderation-support'
import {
  heldOf,
  heldPeople,
  hold,
  insertHeld,
  noticesFor,
  withdrawHeld,
} from './held-applications-support'
import type { SyntheticUser } from './roles'
import { pauseLevel } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, rescuer, inReview, noRequest } = heldPeople(cleanups)

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
