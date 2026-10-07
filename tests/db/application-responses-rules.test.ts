// Las reglas de responder una solicitud (historia #65): las listas y los topes son los de
// lib/applications/, aceptar controla dueño, estado y teléfonos con el candado de la solicitud, y una
// aceptada sigue activa.
import { afterEach, expect, it } from 'vitest'
import { REJECTION_REASONS } from '../../src/lib/applications/rejection'
import {
  MAX_QUESTIONS,
  QUESTION_MAX_LENGTH,
  REJECTION_NOTE_MAX_LENGTH,
} from '../../src/lib/applications/rules'
import { describeDb } from '../setup/env-report'
import { accept, markAccepted, open, responsePeople } from './application-responses-support'
import {
  applicationsOf,
  contextOf,
  insertApplication,
  petOf,
  submit,
  withdraw,
} from './applications-support'
import { setPhone, sql } from './listing-support'
import { block, suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, scene, publisherWithPet } = responsePeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function reviewOf(id: string) {
  const { data } = await db().from('application_reviews').select('*').eq('application_id', id)
  return data?.[0] ?? null
}

describeDb('las reglas de la base son las de lib/applications/', () => {
  // Covers: FR-020, FR-030, FR-031 (paridad)
  it('los motivos de rechazo en orden, 3 preguntas de 500 y la línea de 200', async () => {
    const reasons = await sql<{ id: string }>('select id from private.rejection_reasons()')
    expect(reasons.map((row) => row.id)).toEqual([...REJECTION_REASONS])
    const [row] = await sql<{ questions: number; question: number; note: number }>(
      `select private.max_questions() as questions, private.question_max_length() as question,
              private.rejection_note_max_length() as note`,
    )
    expect(row).toEqual({
      questions: MAX_QUESTIONS,
      question: QUESTION_MAX_LENGTH,
      note: REJECTION_NOTE_MAX_LENGTH,
    })
  })
})

describeDb('aceptar', () => {
  // Covers: US1-AS3, FR-012, FR-016
  it('el publicador acepta una que espera respuesta: queda aceptada, con la fecha y la primera respuesta', async () => {
    const { publisher, applicant, id } = await scene()

    expect(await accept(publisher, id)).toMatchObject({ outcome: 'accepted', first_response: true })

    const [row] = await applicationsOf(applicant.id)
    expect(row).toMatchObject({ id, status: 'accepted' })
    const review = await reviewOf(id)
    expect(review?.accepted_at).not.toBeNull()
    expect(review?.first_response_at).not.toBeNull()
  })

  // Covers: FR-064, edge «tocar dos veces»
  it('dos veces: la segunda dice que ya estaba y no es una primera respuesta', async () => {
    const { publisher, id } = await scene()
    await accept(publisher, id)
    expect(await accept(publisher, id)).toMatchObject({
      outcome: 'already_accepted',
      first_response: false,
    })
  })

  // Covers: FR-001, FR-044
  it('una ajena o inexistente no existe, aunque la pida otra publicadora o quien solicitó', async () => {
    const { applicant, id } = await scene()
    const other = await person(1, 'Otra publicadora')
    expect((await accept(other, id)).outcome).toBe('not_found')
    expect((await accept(applicant, id)).outcome).toBe('not_found')
    expect((await accept(other, crypto.randomUUID())).outcome).toBe('not_found')
    const [row] = await applicationsOf(applicant.id)
    expect(row?.status).toBe('sent')
  })

  // Covers: US1-AS11, FR-042, FR-044
  it('retirada mientras miraba: `gone`, sin cambiar nada', async () => {
    const { publisher, applicant, id } = await scene()
    expect((await withdraw(applicant, id)).outcome).toBe('withdrawn')
    expect(await accept(publisher, id)).toMatchObject({ outcome: 'gone', first_response: false })
    const [row] = await applicationsOf(applicant.id)
    expect(row?.status).toBe('withdrawn')
    expect(await reviewOf(id)).toBeNull()
  })

  // Covers: FR-042 (bloqueo y suspensión de quien solicitó se ven igual que el retiro)
  it('cerrada por el bloqueo de quien solicitó o su suspensión: `gone`; por el bloqueo del publicador, `you_blocked`', async () => {
    const blocked = await scene()
    await block(blocked.applicant.id, blocked.publisher.id)
    expect((await accept(blocked.publisher, blocked.id)).outcome).toBe('gone')

    const suspended = await scene()
    await suspend(suspended.applicant.id)
    expect((await accept(suspended.publisher, suspended.id)).outcome).toBe('gone')

    const mine = await scene()
    await block(mine.publisher.id, mine.applicant.id)
    expect((await accept(mine.publisher, mine.id)).outcome).toBe('you_blocked')
  })

  // Covers: FR-040, FR-044
  it('cerrada por el animal: `closed` con el motivo; rechazada: `rejected`', async () => {
    const adopted = await scene('closed', { closeReason: 'adopted' })
    expect(await accept(adopted.publisher, adopted.id)).toMatchObject({
      outcome: 'closed',
      close_reason: 'adopted',
    })
    const rejected = await scene('rejected')
    expect((await accept(rejected.publisher, rejected.id)).outcome).toBe('rejected')
  })

  // Covers: US1-AS12, US1-AS13, FR-011
  it('sin el teléfono del publicador o de quien solicitó, no acepta', async () => {
    const publisherLost = await scene()
    await setPhone(publisherLost.publisher.id, 'change_pending')
    expect((await accept(publisherLost.publisher, publisherLost.id)).outcome).toBe(
      'publisher_needs_phone',
    )

    const applicantLost = await scene()
    await setPhone(applicantLost.applicant.id, 'none')
    expect((await accept(applicantLost.publisher, applicantLost.id)).outcome).toBe(
      'applicant_needs_phone',
    )
    const [row] = await applicationsOf(applicantLost.applicant.id)
    expect(row?.status).toBe('sent')
  })

  // Covers: US1-AS16, FR-007
  it('con el animal pausado o vencido se acepta igual', async () => {
    for (const state of ['paused', 'expired'] as const) {
      // oxlint-disable-next-line no-await-in-loop -- un animal por estado, de a uno
      const { publisher, id } = await scene('sent', { state })
      // oxlint-disable-next-line no-await-in-loop -- idem
      expect((await accept(publisher, id)).outcome).toBe('accepted')
    }
  })

  // Covers: R11 (la primera respuesta es la primera, aunque antes se haya abierto)
  it('abrirla antes no cuenta como respuesta', async () => {
    const { publisher, id } = await scene()
    await open(publisher, id)
    expect((await accept(publisher, id)).first_response).toBe(true)
  })

  // Covers: FR-005 (abrir, la primera vez)
  it('abrirla la marca una sola vez; ajena, nada', async () => {
    const { publisher, id } = await scene()
    const other = await person(1, 'Otra persona')
    expect(await open(other, id)).toEqual([])
    expect((await open(publisher, id))[0]?.opened_first).toBe(true)
    expect((await open(publisher, id))[0]?.opened_first).toBe(false)
  })
})

describeDb('una aceptada sigue activa', () => {
  // Covers: FR-016, US1-AS3
  it('cuenta entre las 3 y no deja mandar otra al mismo animal', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await markAccepted(id)

    expect((await submit(applicant, pet.code)).outcome).toBe('has_active')
    const [context] = await contextOf(applicant, pet.code)
    expect(context).toMatchObject({ my_active_id: id, active_count: 1, my_rejected: false })

    const second = await petOf(publisher, { name: 'Luna' })
    const third = await petOf(publisher, { name: 'Michi' })
    const fourth = await petOf(publisher, { name: 'Nube' })
    expect((await submit(applicant, second.code)).outcome).toBe('sent')
    expect((await submit(applicant, third.code)).outcome).toBe('sent')
    expect((await submit(applicant, fourth.code)).outcome).toBe('limit')
  })

  // Covers: FR-052
  it('quien solicitó la puede retirar', async () => {
    const { applicant, id } = await scene()
    await markAccepted(id)
    expect((await withdraw(applicant, id)).outcome).toBe('withdrawn')
  })

  // Covers: R1 (forward-only): una aceptada no vuelve a esperar respuesta, una final no se mueve
  it('no vuelve a esperar respuesta; rechazada no se acepta ni se retira', async () => {
    const { applicant, id } = await scene()
    await markAccepted(id)
    const back = await db().from('applications').update({ status: 'sent' }).eq('id', id)
    expect(back.error?.message).toBe('application_final')

    const rejected = await scene('rejected')
    const up = await db().from('applications').update({ status: 'accepted' }).eq('id', rejected.id)
    expect(up.error?.message).toBe('application_final')
    expect((await withdraw(rejected.applicant, rejected.id)).outcome).toBe('rejected')
    expect((await withdraw(applicant, id)).outcome).toBe('withdrawn')
  })

  // Covers: FR-041 (bloquear y suspender cierran también una aceptada)
  it('un bloqueo o una suspensión cierran también una aceptada', async () => {
    const blocked = await scene()
    await markAccepted(blocked.id)
    await block(blocked.publisher.id, blocked.applicant.id)
    expect((await applicationsOf(blocked.applicant.id))[0]).toMatchObject({
      status: 'closed',
      close_reason: 'not_receiving',
    })

    const suspended = await scene()
    await markAccepted(suspended.id)
    await suspend(suspended.publisher.id)
    expect((await applicationsOf(suspended.applicant.id))[0]).toMatchObject({
      status: 'closed',
      close_reason: 'unpublished',
    })
  })

  // Covers: R7, FR-023
  it('quien fue rechazado no vuelve a solicitar ese animal, y sí otro', async () => {
    const { publisher, pet, applicant } = await scene('rejected')
    expect((await submit(applicant, pet.code)).outcome).toBe('rejected')
    const [context] = await contextOf(applicant, pet.code)
    expect(context?.my_rejected).toBe(true)
    const other = await petOf(publisher, { name: 'Luna' })
    expect((await submit(applicant, other.code)).outcome).toBe('sent')
  })
})

describeDb('las reviews validan lo que guardan', () => {
  // Covers: FR-020, FR-024 (la base no guarda un motivo que no existe)
  it('un motivo desconocido, `not_concluded` sin aceptación y «otro» sin línea no entran', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1, 'Quien solicita')
    const id = await insertApplication(applicant, pet, publisher, { status: 'rejected' })
    const now = new Date().toISOString()
    const write = (row: Record<string, string | null>) =>
      db()
        .from('application_reviews')
        .upsert({ application_id: id, rejected_at: now, ...row })
    expect((await write({ rejection_reason: 'cualquiera' })).error).not.toBeNull()
    expect((await write({ rejection_reason: 'not_concluded' })).error).not.toBeNull()
    expect((await write({ rejection_reason: 'other' })).error).not.toBeNull()
    expect((await write({ rejection_reason: 'other', rejection_note: '   ' })).error).not.toBeNull()
    expect(
      (await write({ rejection_reason: 'other', rejection_note: 'x'.repeat(201) })).error,
    ).not.toBeNull()
    expect(
      (await write({ rejection_reason: 'housing', rejection_note: 'nota' })).error,
    ).not.toBeNull()
    expect(
      (await write({ rejection_reason: 'other', rejection_note: 'x'.repeat(200) })).error,
    ).toBeNull()
    expect(
      (await write({ rejection_reason: 'not_concluded', accepted_at: now, rejection_note: null }))
        .error,
    ).toBeNull()
  })
})
