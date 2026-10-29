// Las reglas del pedido de identidad (historia #257): uno por solicitud con un solo aviso, solo de
// quien publicó, solo esperando respuesta y solo a quien no tiene la identidad, sin tocar nada de lo
// que mide las respuestas.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  accept,
  ask,
  markAccepted,
  open,
  petApplicationsAs,
  questionsAs,
  setStatus,
} from './application-responses-support'
import { insertApplication, withdraw } from './applications-support'
import {
  askIdentity,
  askPeople,
  askRowOf,
  identityNoticesOf,
  insertAsk,
  reviewOf,
} from './identity-asks-support'
import { setPhone } from './listing-support'
import { block, suspend } from './moderation-support'
import type { SyntheticUser } from './roles'
import { verifyIdentity } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, asking, scene, verifiedWithoutPhone, youngScene } = askPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('pedir la identidad', () => {
  // Covers: US1-AS1, FR-001, FR-003, FR-019
  it('queda un pedido con su día y un aviso a quien solicitó', async () => {
    const { publisher, applicant, id } = await asking()
    const before = Date.now()
    const asked = await askIdentity(publisher, id)

    expect(asked).toMatchObject({ outcome: 'asked', in_litter: false })
    expect(new Date(asked.asked_at ?? 0).getTime()).toBeGreaterThanOrEqual(before - 60_000)
    expect(await askRowOf(id)).toEqual({
      application_id: id,
      asked_at: asked.asked_at,
      resolved_at: null,
    })
    expect(await identityNoticesOf([id])).toEqual([
      { kind: 'identity_asked', application_id: id, recipient_id: applicant.id },
    ])
  })

  // Covers: US1-AS6, FR-003, SC-002
  it('dos veces, también a la vez: un pedido y un aviso; la segunda dice `already` con el mismo día', async () => {
    const { publisher, id } = await asking()
    const first = await askIdentity(publisher, id)
    const second = await askIdentity(publisher, id)
    expect(second).toEqual({ outcome: 'already', asked_at: first.asked_at, in_litter: false })
    expect(await identityNoticesOf([id])).toHaveLength(1)

    const parallel = await asking()
    const both = await Promise.all([
      askIdentity(parallel.publisher, parallel.id),
      askIdentity(parallel.publisher, parallel.id),
    ])
    expect(both.map((row) => row.outcome).toSorted()).toEqual(['already', 'asked'])
    expect(new Set(both.map((row) => row.asked_at)).size).toBe(1)
    expect(await identityNoticesOf([parallel.id])).toHaveLength(1)
  })

  // Covers: US1-AS7, US1-AS5, FR-006, R3
  it('a quien ya tiene la identidad, también sin teléfono: `verified`, sin pedido ni aviso', async () => {
    const withLevel = await scene()
    await verifyIdentity(withLevel.applicant.id)
    expect(await askIdentity(withLevel.publisher, withLevel.id)).toEqual({
      outcome: 'verified',
      asked_at: null,
      in_litter: false,
    })

    const lostPhone = await scene()
    const withoutPhone = await verifiedWithoutPhone()
    const lostId = await insertApplication(withoutPhone, lostPhone.pet, lostPhone.publisher)
    expect((await askIdentity(lostPhone.publisher, lostId)).outcome).toBe('verified')

    expect(await askRowOf(withLevel.id)).toBeNull()
    expect(await askRowOf(lostId)).toBeNull()
    expect(await identityNoticesOf([withLevel.id, lostId])).toEqual([])
  })

  // Covers: US1-AS8, FR-007
  it('aceptada o rechazada: `not_waiting`, sin pedido ni aviso', async () => {
    const accepted = await scene()
    await markAccepted(accepted.id)
    const rejected = await scene('rejected')
    expect((await askIdentity(accepted.publisher, accepted.id)).outcome).toBe('not_waiting')
    expect((await askIdentity(rejected.publisher, rejected.id)).outcome).toBe('not_waiting')
    expect(await askRowOf(accepted.id)).toBeNull()
    expect(await identityNoticesOf([accepted.id, rejected.id])).toEqual([])
  })

  // Covers: US1-AS8, FR-007 (el texto con el que ya se dice por qué se cerró)
  it('retirada, bloqueada o cerrada: `gone`, `you_blocked` y `closed`, como aceptar', async () => {
    const withdrawn = await scene()
    expect((await withdraw(withdrawn.applicant, withdrawn.id)).outcome).toBe('withdrawn')
    expect((await askIdentity(withdrawn.publisher, withdrawn.id)).outcome).toBe('gone')

    const suspended = await scene()
    await suspend(suspended.applicant.id)
    expect((await askIdentity(suspended.publisher, suspended.id)).outcome).toBe('gone')

    const mine = await scene()
    await block(mine.publisher.id, mine.applicant.id)
    expect((await askIdentity(mine.publisher, mine.id)).outcome).toBe('you_blocked')

    const adopted = await scene('closed', { closeReason: 'adopted' })
    expect((await askIdentity(adopted.publisher, adopted.id)).outcome).toBe('closed')

    const ids = [withdrawn.id, suspended.id, mine.id, adopted.id]
    expect(await identityNoticesOf(ids)).toEqual([])
    for (const id of ids) {
      // oxlint-disable-next-line no-await-in-loop -- una lectura por solicitud
      expect(await askRowOf(id)).toBeNull()
    }
  })

  // Covers: US1-AS6 (el reintento después del cierre dice que ya se pidió, research R2)
  it('ya pedida y después cerrada: `already`, no un error', async () => {
    const { publisher, applicant, id } = await asking()
    const first = await askIdentity(publisher, id)
    await withdraw(applicant, id)
    expect(await askIdentity(publisher, id)).toMatchObject({
      outcome: 'already',
      asked_at: first.asked_at,
    })
  })

  // Covers: US1-AS9, FR-008
  it('otra persona, quien solicitó o una que no existe: `not_found`, sin pedido', async () => {
    const { applicant, id } = await asking()
    const other = await person(2, 'Otra rescatista')
    expect((await askIdentity(other, id)).outcome).toBe('not_found')
    expect((await askIdentity(applicant, id)).outcome).toBe('not_found')
    expect((await askIdentity(other, crypto.randomUUID())).outcome).toBe('not_found')
    expect(await askRowOf(id)).toBeNull()
  })

  // Covers: US1-AS10
  it('una cría: igual que un animal solo, con la marca de camada', async () => {
    const { publisher, applicant, id } = await youngScene()
    expect(await askIdentity(publisher, id)).toMatchObject({ outcome: 'asked', in_litter: true })
    expect(await identityNoticesOf([id])).toEqual([
      { kind: 'identity_asked', application_id: id, recipient_id: applicant.id },
    ])
  })

  // Covers: US1-AS4, FR-005
  it('no cuenta como respuesta ni como pregunta, ni la abre', async () => {
    const { publisher, applicant, id } = await asking()
    await ask(publisher, id, '¿Tenés patio?')
    const before = await reviewOf(id)
    expect((await askIdentity(publisher, id)).outcome).toBe('asked')
    expect(await reviewOf(id)).toEqual(before)
    expect(before?.opened_at).toBeNull()
    const questions = (await questionsAs(applicant.client, id)).rows
    expect(questions.map((row) => row.answer)).toEqual([null])

    const fresh = await asking()
    expect((await askIdentity(fresh.publisher, fresh.id)).outcome).toBe('asked')
    expect(await reviewOf(fresh.id)).toBeNull()
    expect((await accept(fresh.publisher, fresh.id)).first_response).toBe(true)
  })

  // Covers: US1-AS11, FR-009 (pedir no exige nivel 2 ni el teléfono de quien publicó)
  it('quien publicó sin teléfono puede pedir', async () => {
    const { publisher, id } = await asking()
    await setPhone(publisher.id, 'none')
    expect((await askIdentity(publisher, id)).outcome).toBe('asked')
  })
})

describeDb('la marca de la fila', () => {
  // Covers: US1-AS3, FR-014
  it('con el pedido abierto, sí; resuelto, sin pedido o fuera de esperando respuesta, no', async () => {
    const { publisher, pet, id } = await asking()
    const plain = await person(1, 'Sin pedido')
    const resolvedFor = await person(1, 'Ya verificó')
    const closedFor = await person(1, 'Retirada')
    const plainId = await insertApplication(plain, pet, publisher)
    const resolvedId = await insertApplication(resolvedFor, pet, publisher)
    const closedId = await insertApplication(closedFor, pet, publisher)
    expect((await askIdentity(publisher, id)).outcome).toBe('asked')
    await insertAsk(resolvedId, new Date(Date.now() + 1000).toISOString())
    await insertAsk(closedId)
    await setStatus(closedId, 'withdrawn')

    const { rows, error } = await petApplicationsAs(publisher.client, pet.petId)
    expect(error).toBeNull()
    const marks = new Map(rows.map((row) => [row.id, row.identity_asked]))
    expect(marks).toEqual(
      new Map([
        [id, true],
        [plainId, false],
        [resolvedId, false],
        [closedId, false],
      ]),
    )
  })

  // Covers: FR-014 (abrirla no saca la marca: la saca resolverse)
  it('abrirla no cambia la marca', async () => {
    const { publisher, pet, id } = await asking()
    await askIdentity(publisher, id)
    await open(publisher, id)
    const { rows } = await petApplicationsAs(publisher.client, pet.petId)
    expect(rows.find((row) => row.id === id)?.identity_asked).toBe(true)
  })
})
