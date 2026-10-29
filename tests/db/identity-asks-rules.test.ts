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
  publisherViewAs,
  questionsAs,
  setStatus,
  visit,
} from './application-responses-support'
import { insertApplication, withdraw, type Person } from './applications-support'
import {
  applyToNewPet,
  askIdentity,
  askPeople,
  askRowOf,
  identityNoticesOf,
  insertAsk,
  myApplicationAs,
  reviewOf,
} from './identity-asks-support'
import {
  expireAll,
  makeExpired,
  openRequest,
  resolve,
  withdraw as withdrawRequest,
} from './identity-support'
import { applyForYoung } from './litter-support'
import { setPhone } from './listing-support'
import { block, suspend } from './moderation-support'
import type { SyntheticUser } from './roles'
import { askedTicket, countsOf } from './verification-exits-support'
import { verifyIdentity } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, asking, scene, verifiedWithoutPhone, youngScene } = askPeople(cleanups)

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

describeDb('el pedido en Mi solicitud', () => {
  // Covers: US2-AS1, FR-015 (las chapitas de quien publicó, solo con el pedido)
  it('con el pedido abierto: la marca y el nivel de ahora de quien publicó', async () => {
    const { publisher, applicant, id } = await asking()
    const before = await myApplicationAs(applicant.client, id)
    expect(before.error).toBeNull()
    expect(before.rows[0]).toMatchObject({
      identity_asked: false,
      identity_resolved_at: null,
      publisher_level: null,
    })

    expect((await askIdentity(publisher, id)).outcome).toBe('asked')
    const { rows } = await myApplicationAs(applicant.client, id)
    expect(rows[0]).toMatchObject({
      identity_asked: true,
      identity_resolved_at: null,
      publisher_level: 1,
    })
  })

  // Covers: US2-AS8, FR-016
  it('resuelto, con la solicitud esperando: el día de la aprobación, sin la marca', async () => {
    const { applicant, id } = await asking()
    const resolvedAt = new Date(Date.now() + 1000).toISOString()
    await insertAsk(id, resolvedAt)
    const { rows } = await myApplicationAs(applicant.client, id)
    expect(rows[0]?.identity_asked).toBe(false)
    expect(new Date(rows[0]?.identity_resolved_at ?? 0).toISOString()).toBe(resolvedAt)
    expect(rows[0]?.publisher_level).toBe(1)
  })

  // Covers: US2-AS9, FR-017
  it.each([
    ['accepted', null],
    ['rejected', null],
    ['withdrawn', null],
    ['closed', 'adopted'],
  ] as const)('%s: nada del pedido, abierto o resuelto', async (status, closeReason) => {
    const waiting = await asking()
    await insertAsk(waiting.id)
    await setStatus(waiting.id, status, closeReason)
    const resolved = await asking()
    await insertAsk(resolved.id, new Date(Date.now() + 1000).toISOString())
    await setStatus(resolved.id, status, closeReason)

    for (const { applicant, id } of [waiting, resolved]) {
      // oxlint-disable-next-line no-await-in-loop -- una solicitud por vez
      const { rows } = await myApplicationAs(applicant.client, id)
      expect(rows[0]).toMatchObject({
        id,
        identity_asked: false,
        identity_resolved_at: null,
        publisher_level: null,
      })
    }
  })
})

describeDb('el origen «se la pidió quien publicó»', () => {
  // Covers: US2-AS3, FR-035
  it('la pregunta de por qué se deja acepta `asked` y suma en su fila de cada nivel', async () => {
    const before = {
      phone: await countsOf('phone', 'asked'),
      identity: await countsOf('identity', 'asked'),
      self: await countsOf('identity', 'self'),
    }
    const { applicant } = await asking()
    await askedTicket(applicant.client, 'identity', 'asked')
    const noPhone = await person(0, 'Sin teléfono')
    await askedTicket(noPhone.client, 'phone', 'asked')

    expect((await countsOf('identity', 'asked'))?.asked).toBe((before.identity?.asked ?? 0) + 1)
    expect((await countsOf('phone', 'asked'))?.asked).toBe((before.phone?.asked ?? 0) + 1)
    expect((await countsOf('identity', 'self'))?.asked).toBe(before.self?.asked)
  })
})

// Aprobar como lo hace la revisión: un pedido de verificación en revisión que resuelve quien
// administra.
async function approve(applicant: Person) {
  const reviewer = await admin()
  return resolve(await openRequest(applicant.id), reviewer.id)
}

/** Quien publicó ya la había abierto antes de pedir, como en la pantalla. */
async function askedAfterOpening(found: { publisher: Person; id: string }) {
  await open(found.publisher, found.id)
  expect((await askIdentity(found.publisher, found.id)).outcome).toBe('asked')
}

describeDb('aprobar la identidad', () => {
  // Covers: US3-AS1, FR-024, FR-025, FR-026
  it('resuelve el pedido, la vuelve a marcar como nueva, avisa a quien publicó y da su nivel', async () => {
    const found = await asking()
    await askedAfterOpening(found)
    const { publisher, applicant, pet, id } = found
    expect((await reviewOf(id))?.opened_at).not.toBeNull()

    const before = Date.now()
    const approved = await approve(applicant)

    expect(approved).toMatchObject({ decision: 'approved', asker_levels: [1] })
    const row = await askRowOf(id)
    expect(new Date(row?.resolved_at ?? 0).getTime()).toBeGreaterThanOrEqual(before - 60_000)
    expect((await reviewOf(id))?.opened_at).toBeNull()
    expect(await identityNoticesOf([id])).toEqual([
      { kind: 'identity_asked', application_id: id, recipient_id: applicant.id },
      { kind: 'identity_verified', application_id: id, recipient_id: publisher.id },
    ])
    const { rows } = await petApplicationsAs(publisher.client, pet.petId)
    expect(rows.find((item) => item.id === id)).toMatchObject({
      is_new: true,
      identity_asked: false,
    })
    const view = await publisherViewAs(publisher.client, id)
    expect(view.rows[0]).toMatchObject({
      identity_resolved_at: row?.resolved_at,
      applicant_identity_verified: true,
    })
  })

  // Covers: US3-AS5, FR-024, FR-026
  it('con pedidos de dos rescatistas: resuelve los dos, avisa a cada una y da los dos niveles', async () => {
    const first = await asking()
    await askedAfterOpening(first)
    const other = await person(2, 'Otra rescatista')
    const second = await applyToNewPet(first.applicant, other)
    await askedAfterOpening({ publisher: other, id: second.id })

    const approved = await approve(first.applicant)

    expect(approved.asker_levels?.toSorted((a, b) => a - b)).toEqual([1, 2])
    expect((await askRowOf(first.id))?.resolved_at).not.toBeNull()
    expect((await askRowOf(second.id))?.resolved_at).not.toBeNull()
    const verified = (await identityNoticesOf([first.id, second.id])).filter(
      (notice) => notice.kind === 'identity_verified',
    )
    expect(verified).toHaveLength(2)
    expect(
      new Set(verified.map((notice) => `${notice.application_id}:${notice.recipient_id}`)),
    ).toEqual(new Set([`${first.id}:${first.publisher.id}`, `${second.id}:${other.id}`]))
  })

  // Covers: US3-AS1 (la regla del correo de solicitud nueva, research R6)
  it('con otra nueva sin abrir del mismo animal posterior a la visita: sin aviso', async () => {
    const found = await asking()
    await askedAfterOpening(found)
    await visit(found.publisher, found.pet.petId)
    const later = await person(1, 'Llegó después de la visita')
    await insertApplication(later, found.pet, found.publisher)

    expect((await approve(found.applicant)).asker_levels).toEqual([1])
    expect((await askRowOf(found.id))?.resolved_at).not.toBeNull()
    expect((await reviewOf(found.id))?.opened_at).toBeNull()
    expect((await identityNoticesOf([found.id])).map((notice) => notice.kind)).toEqual([
      'identity_asked',
    ])
  })

  // Covers: US3-AS1 (una nueva que ya vio en la visita no frena el aviso)
  it('con otra sin abrir que llegó antes de la visita: con aviso', async () => {
    const found = await asking()
    const earlier = await person(1, 'Llegó antes de la visita')
    await insertApplication(earlier, found.pet, found.publisher)
    await askedAfterOpening(found)
    await visit(found.publisher, found.pet.petId)

    await approve(found.applicant)
    expect((await identityNoticesOf([found.id])).map((notice) => notice.kind)).toEqual([
      'identity_asked',
      'identity_verified',
    ])
  })

  // Covers: US3-AS1, research R6 (una que volvió a ser nueva después de la visita cuenta como nueva)
  it('con otra que volvió a ser nueva después de la visita: sin aviso', async () => {
    const found = await asking()
    const again = await person(1, 'Volvió a ser nueva')
    const againId = await insertApplication(again, found.pet, found.publisher)
    await askedAfterOpening(found)
    await visit(found.publisher, found.pet.petId)
    await insertAsk(againId, new Date(Date.now() + 60_000).toISOString())

    await approve(found.applicant)
    expect((await identityNoticesOf([found.id])).map((notice) => notice.kind)).toEqual([
      'identity_asked',
    ])
  })

  // Covers: US3-AS6 (una cría es su propio animal, como en el correo de solicitud nueva de la #206)
  it('una cría: la nueva de otra cría de la camada no frena el aviso; la de la misma cría, sí', async () => {
    const found = await youngScene()
    await askedAfterOpening(found)
    await visit(found.publisher, found.young.id)
    const sibling = found.litter.young[1]
    if (sibling === undefined) throw new Error('la camada no trajo la segunda cría')
    await applyForYoung(await person(1, 'Por otra cría'), sibling, found.publisher)

    expect((await approve(found.applicant)).asker_levels).toEqual([1])
    expect((await identityNoticesOf([found.id])).map((notice) => notice.kind)).toEqual([
      'identity_asked',
      'identity_verified',
    ])

    const same = await youngScene()
    await askedAfterOpening(same)
    await visit(same.publisher, same.young.id)
    await applyForYoung(await person(1, 'Por la misma cría'), same.young, same.publisher)
    await approve(same.applicant)
    expect((await askRowOf(same.id))?.resolved_at).not.toBeNull()
    expect((await identityNoticesOf([same.id])).map((notice) => notice.kind)).toEqual([
      'identity_asked',
    ])
  })

  // Covers: US3-AS4, FR-027
  it.each([
    ['accepted', null],
    ['rejected', null],
    ['withdrawn', null],
    ['closed', 'adopted'],
  ] as const)(
    '%s antes de aprobar: el pedido no se resuelve, ni vuelve a ser nueva, ni avisa',
    async (status, closeReason) => {
      const found = await asking()
      await askedAfterOpening(found)
      await setStatus(found.id, status, closeReason)
      const opened = (await reviewOf(found.id))?.opened_at

      expect((await approve(found.applicant)).asker_levels).toEqual([])
      expect((await askRowOf(found.id))?.resolved_at).toBeNull()
      expect((await reviewOf(found.id))?.opened_at).toBe(opened)
      expect((await identityNoticesOf([found.id])).map((notice) => notice.kind)).toEqual([
        'identity_asked',
      ])
    },
  )

  // Covers: US3-AS3, FR-028
  it('rechazar, vencer o retirar el pedido de verificación no tocan el pedido', async () => {
    const rejected = await asking()
    await askedAfterOpening(rejected)
    const reviewer = await admin()
    const outcome = await resolve(
      await openRequest(rejected.applicant.id),
      reviewer.id,
      'reject',
      'unreadable',
    )
    expect(outcome).toMatchObject({ decision: 'rejected', asker_levels: [] })

    const expired = await asking()
    await askedAfterOpening(expired)
    await makeExpired(await openRequest(expired.applicant.id))
    await expireAll()

    const withdrawn = await asking()
    await askedAfterOpening(withdrawn)
    await openRequest(withdrawn.applicant.id)
    await withdrawRequest(withdrawn.applicant.id)

    for (const { id } of [rejected, expired, withdrawn]) {
      // oxlint-disable-next-line no-await-in-loop -- una solicitud por vez
      expect((await askRowOf(id))?.resolved_at).toBeNull()
      // oxlint-disable-next-line no-await-in-loop -- una solicitud por vez
      expect((await reviewOf(id))?.opened_at).not.toBeNull()
      // oxlint-disable-next-line no-await-in-loop -- una solicitud por vez
      expect((await identityNoticesOf([id])).map((notice) => notice.kind)).toEqual([
        'identity_asked',
      ])
    }
  })

  // Covers: US3-AS2, research R5 (abrirla de nuevo no es la primera vez)
  it('abrirla después de resolver la deja de marcar como nueva sin volver a contar la primera vez', async () => {
    const found = await asking()
    expect((await open(found.publisher, found.id))[0]?.opened_first).toBe(true)
    expect((await askIdentity(found.publisher, found.id)).outcome).toBe('asked')
    await approve(found.applicant)

    expect((await open(found.publisher, found.id))[0]?.opened_first).toBe(false)
    expect((await reviewOf(found.id))?.opened_at).not.toBeNull()
    const { rows } = await petApplicationsAs(found.publisher.client, found.pet.petId)
    expect(rows.find((item) => item.id === found.id)?.is_new).toBe(false)
  })

  // Covers: US3-AS4, FR-027 (el candado de la solicitud ordena aceptar y aprobar a la vez)
  it('aceptar y aprobar a la vez terminan en uno de los dos estados enteros', async () => {
    const found = await asking()
    await askedAfterOpening(found)
    const reviewer = await admin()
    const request = await openRequest(found.applicant.id)

    const [accepted, approved] = await Promise.all([
      accept(found.publisher, found.id),
      resolve(request, reviewer.id),
    ])

    expect(accepted.outcome).toBe('accepted')
    expect(approved.decision).toBe('approved')
    const resolved = (await askRowOf(found.id))?.resolved_at !== null
    const notified = (await identityNoticesOf([found.id])).some(
      (notice) => notice.kind === 'identity_verified',
    )
    expect(notified).toBe(resolved)
    expect(approved.asker_levels).toEqual(resolved ? [1] : [])
  })
})
