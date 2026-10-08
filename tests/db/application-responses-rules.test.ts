// Las reglas de responder una solicitud (historia #65): las listas y los topes son los de
// lib/applications/, aceptar controla dueño, estado y teléfonos con el candado de la solicitud, una
// aceptada sigue activa, y rechazar o dejar sin efecto guardan el motivo que solo lee el publicador.
import { afterEach, expect, it } from 'vitest'
import { REJECTION_REASONS } from '../../src/lib/applications/rejection'
import {
  MAX_QUESTIONS,
  QUESTION_MAX_LENGTH,
  REJECTION_NOTE_MAX_LENGTH,
} from '../../src/lib/applications/rules'
import { describeDb } from '../setup/env-report'
import {
  accept,
  answer,
  ask,
  markAccepted,
  noticesOf,
  open,
  publisherViewAs,
  questionsAs,
  reject,
  responsePeople,
  revoke,
} from './application-responses-support'
import {
  applicationsOf,
  contextOf,
  detailAs,
  insertApplication,
  mineAs,
  petOf,
  submit,
  withdraw,
} from './applications-support'
import { setState } from './lifecycle-support'
import { setPhone, sql } from './listing-support'
import { block, suspend } from './moderation-support'
import { db } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, scene, publisherWithPet } = responsePeople(cleanups)

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

describeDb('rechazar', () => {
  // Covers: US2-AS1, FR-020, FR-021, FR-022
  it('con un motivo de la lista: queda rechazada con el motivo, primera respuesta, y libera el lugar', async () => {
    const { publisher, pet, applicant, id } = await scene()

    expect(await reject(publisher, id, 'alone_too_long')).toMatchObject({
      outcome: 'rejected',
      first_response: true,
    })
    expect((await applicationsOf(applicant.id))[0]).toMatchObject({ id, status: 'rejected' })
    const review = await reviewOf(id)
    expect(review).toMatchObject({ rejection_reason: 'alone_too_long', rejection_note: null })
    expect(review?.rejected_at).not.toBeNull()
    expect(review?.first_response_at).not.toBeNull()
    const [context] = await contextOf(applicant, pet.code)
    expect(context).toMatchObject({ my_active_id: null, active_count: 0, my_rejected: true })
  })

  // Covers: US2-AS2, FR-020 (la línea de «otro»: obligatoria, hasta 200, solo con «otro»)
  it('«otro» pide su línea de 1 a 200; otro motivo no lleva línea; uno que no existe no entra', async () => {
    const { publisher, applicant, id } = await scene()
    const attempts: [string, string | null][] = [
      ['other', null],
      ['other', '   '],
      ['other', 'x'.repeat(201)],
      ['housing', 'nota'],
      ['not_concluded', null],
      ['cualquiera', null],
    ]
    for (const [reason, note] of attempts) {
      // oxlint-disable-next-line no-await-in-loop -- un intento por vez sobre la misma solicitud
      expect((await reject(publisher, id, reason, note)).outcome).toBe('invalid')
    }
    expect((await applicationsOf(applicant.id))[0]?.status).toBe('sent')
    expect(await reviewOf(id)).toBeNull()
    expect(await noticesOf([id])).toEqual([])

    expect((await reject(publisher, id, 'other', 'x'.repeat(200))).outcome).toBe('rejected')
    expect(await reviewOf(id)).toMatchObject({
      rejection_reason: 'other',
      rejection_note: 'x'.repeat(200),
    })
  })

  // Covers: FR-064, R11 (doble toque; abrir antes no cuenta como respuesta)
  it('dos veces: la segunda dice que ya estaba y no cambia el motivo', async () => {
    const { publisher, id } = await scene()
    await open(publisher, id)
    expect((await reject(publisher, id, 'housing')).first_response).toBe(true)
    expect(await reject(publisher, id, 'chose_other')).toMatchObject({
      outcome: 'already_rejected',
      first_response: false,
    })
    expect((await reviewOf(id))?.rejection_reason).toBe('housing')
  })

  // Covers: R5 (una aceptada se deja sin efecto, no se rechaza)
  it('una aceptada no se rechaza: `accepted`, sin cambiar nada', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)
    expect((await reject(publisher, id, 'housing')).outcome).toBe('accepted')
    expect((await applicationsOf(applicant.id))[0]?.status).toBe('accepted')
    expect((await reviewOf(id))?.rejection_reason).toBeNull()
  })

  // Covers: US2-AS7, FR-042, FR-044
  it('retirada mientras elegía: `gone`; cerrada por el animal: `closed`; bloqueada: `you_blocked`; ajena: `not_found`', async () => {
    const { publisher, applicant, id } = await scene()
    await withdraw(applicant, id)
    expect((await reject(publisher, id, 'housing')).outcome).toBe('gone')
    expect(await reviewOf(id)).toBeNull()
    expect(await noticesOf([id])).toEqual([])

    const adopted = await scene('closed', { closeReason: 'adopted' })
    expect(await reject(adopted.publisher, adopted.id, 'housing')).toMatchObject({
      outcome: 'closed',
      close_reason: 'adopted',
    })

    const mine = await scene()
    await block(mine.publisher.id, mine.applicant.id)
    expect((await reject(mine.publisher, mine.id, 'housing')).outcome).toBe('you_blocked')

    const other = await person(1, 'Otra publicadora')
    const free = await scene()
    expect((await reject(other, free.id, 'housing')).outcome).toBe('not_found')
    expect((await reject(free.applicant, free.id, 'housing')).outcome).toBe('not_found')
    expect((await applicationsOf(free.applicant.id))[0]?.status).toBe('sent')
  })

  // Covers: US2-AS4, FR-023, R7 (tampoco con el animal vuelto a publicar)
  it('quien fue rechazado no vuelve a solicitar el animal, aunque se vuelva a publicar', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await reject(publisher, id, 'housing')
    const day = 86_400_000
    const past = new Date(Date.now() - day).toISOString()
    const future = new Date(Date.now() + 30 * day).toISOString()
    const expire = await db().from('pets').update({ expires_at: past }).eq('id', pet.petId)
    expect(expire.error).toBeNull()
    const renew = await db().from('pets').update({ expires_at: future }).eq('id', pet.petId)
    expect(renew.error).toBeNull()
    expect((await submit(applicant, pet.code)).outcome).toBe('rejected')
  })

  // Covers: FR-021, R2 (quien solicitó ve «no aceptada», nunca el motivo)
  it('el motivo lo lee el publicador; quien solicitó, por ningún camino', async () => {
    const { publisher, applicant, id } = await scene()
    const note = 'Vive en un monoambiente sin patio'
    await reject(publisher, id, 'other', note)

    const [mine, detail, table] = await Promise.all([
      mineAs(applicant.client),
      detailAs(applicant.client, id),
      applicant.client.from('applications').select('*').eq('id', id),
    ])
    expect(mine.rows[0]?.status).toBe('rejected')
    expect(detail.rows[0]?.status).toBe('rejected')
    const text = JSON.stringify([mine.rows, detail.rows, table.data])
    expect(text).not.toContain(note)
    expect(text).not.toContain('rejection')

    const { rows } = await publisherViewAs(publisher.client, id)
    expect(rows[0]).toMatchObject({
      status: 'rejected',
      rejection_reason: 'other',
      rejection_note: note,
    })
  })
})

describeDb('dejar sin efecto', () => {
  // Covers: US2-AS5, FR-024
  it('una aceptada queda rechazada con «no se concretó», guarda que fue aceptada y libera el lugar', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await accept(publisher, id)

    expect(await revoke(publisher, id, 'not_concluded')).toMatchObject({ outcome: 'rejected' })
    expect((await applicationsOf(applicant.id))[0]?.status).toBe('rejected')
    const review = await reviewOf(id)
    expect(review).toMatchObject({ rejection_reason: 'not_concluded', rejection_note: null })
    expect(review?.accepted_at).not.toBeNull()
    expect(review?.rejected_at).not.toBeNull()
    expect((await contextOf(applicant, pet.code))[0]).toMatchObject({
      active_count: 0,
      my_rejected: true,
    })
    expect((await submit(applicant, pet.code)).outcome).toBe('rejected')
  })

  // Covers: FR-024 (los motivos de la lista también valen), FR-064
  it('con un motivo de la lista o «otro» con su línea; dos veces, ya estaba', async () => {
    const listed = await scene()
    await markAccepted(listed.id)
    expect((await revoke(listed.publisher, listed.id, 'household_fit')).outcome).toBe('rejected')
    expect((await revoke(listed.publisher, listed.id, 'housing')).outcome).toBe('already_rejected')
    expect((await reviewOf(listed.id))?.rejection_reason).toBe('household_fit')

    const other = await scene()
    await markAccepted(other.id)
    expect((await revoke(other.publisher, other.id, 'other')).outcome).toBe('invalid')
    expect((await revoke(other.publisher, other.id, 'cualquiera')).outcome).toBe('invalid')
    expect((await applicationsOf(other.applicant.id))[0]?.status).toBe('accepted')
    expect((await revoke(other.publisher, other.id, 'other', 'Se mudó')).outcome).toBe('rejected')
    expect((await reviewOf(other.id))?.rejection_note).toBe('Se mudó')
  })

  // Covers: R5 (`not_accepted`), FR-044
  it('una que espera respuesta no se deja sin efecto; retirada: `gone`; cerrada: `closed`; ajena: `not_found`', async () => {
    const waiting = await scene()
    expect((await revoke(waiting.publisher, waiting.id, 'not_concluded')).outcome).toBe(
      'not_accepted',
    )
    expect((await applicationsOf(waiting.applicant.id))[0]?.status).toBe('sent')

    const gone = await scene()
    await markAccepted(gone.id)
    await withdraw(gone.applicant, gone.id)
    expect((await revoke(gone.publisher, gone.id, 'not_concluded')).outcome).toBe('gone')

    const adopted = await scene('closed', { closeReason: 'adopted' })
    expect(await revoke(adopted.publisher, adopted.id, 'not_concluded')).toMatchObject({
      outcome: 'closed',
      close_reason: 'adopted',
    })

    const other = await person(1, 'Otra publicadora')
    expect((await revoke(other, waiting.id, 'not_concluded')).outcome).toBe('not_found')
  })
})

async function questionsOf(id: string) {
  const { data } = await db()
    .from('application_questions')
    .select('position, question, answer')
    .eq('application_id', id)
    .order('position')
  return data ?? []
}

async function pendingQuestion(id: string): Promise<string> {
  const { data } = await db()
    .from('application_questions')
    .select('id')
    .eq('application_id', id)
    .is('answer', null)
  return data?.[0]?.id ?? ''
}

describeDb('preguntar', () => {
  // Covers: US3-AS1, FR-030, R11 (preguntar es una primera respuesta)
  it('mientras espera respuesta: queda la pregunta, es la primera respuesta y no cambia el estado', async () => {
    const { publisher, applicant, id } = await scene()
    expect(await ask(publisher, id, '¿El balcón tiene red en todos lados?')).toMatchObject({
      outcome: 'asked',
      first_response: true,
    })
    expect(await questionsOf(id)).toEqual([
      { position: 1, question: '¿El balcón tiene red en todos lados?', answer: null },
    ])
    expect((await applicationsOf(applicant.id))[0]?.status).toBe('sent')
    expect((await reviewOf(id))?.first_response_at).not.toBeNull()
    expect((await accept(publisher, id)).first_response).toBe(false)
  })

  // Covers: US3-AS2, US3-AS3, FR-031
  it('una pendiente a la vez y hasta 3', async () => {
    const { publisher, applicant, id } = await scene()
    for (const n of [1, 2, 3]) {
      // oxlint-disable-next-line no-await-in-loop -- en orden: cada una espera la respuesta de la anterior
      const asked = await ask(publisher, id, `Pregunta ${n}`)
      expect(asked).toMatchObject({ outcome: 'asked', first_response: n === 1 })
      // oxlint-disable-next-line no-await-in-loop -- idem
      expect((await ask(publisher, id, 'Otra más')).outcome).toBe('pending')
      // oxlint-disable-next-line no-await-in-loop -- idem
      const question = await pendingQuestion(id)
      // oxlint-disable-next-line no-await-in-loop -- idem
      expect((await answer(applicant, question, `Respuesta ${n}`)).outcome).toBe('answered')
    }
    expect((await ask(publisher, id, 'La cuarta')).outcome).toBe('limit')
    expect((await questionsOf(id)).map((row) => row.position)).toEqual([1, 2, 3])
  })

  // Covers: FR-064 (doble toque de «Enviar pregunta»)
  it('dos veces el mismo intento: una pregunta sola', async () => {
    const { publisher, id } = await scene()
    const attempt = crypto.randomUUID()
    expect((await ask(publisher, id, 'Una', attempt)).outcome).toBe('asked')
    expect(await ask(publisher, id, 'Una', attempt)).toMatchObject({
      outcome: 'already',
      first_response: false,
    })
    expect(await questionsOf(id)).toHaveLength(1)
  })

  // Covers: FR-030, FR-034 (vacía, solo espacios, 500/501)
  it('vacía, de solo espacios o de más de 500 no entra; de 500 sí', async () => {
    const { publisher, id } = await scene()
    expect((await ask(publisher, id, '')).outcome).toBe('invalid')
    expect((await ask(publisher, id, '   ')).outcome).toBe('invalid')
    expect((await ask(publisher, id, 'a'.repeat(QUESTION_MAX_LENGTH + 1))).outcome).toBe('invalid')
    expect(await questionsOf(id)).toEqual([])
    expect((await ask(publisher, id, 'a'.repeat(QUESTION_MAX_LENGTH))).outcome).toBe('asked')
  })

  // Covers: edge «preguntar después de aceptar», FR-044
  it('aceptada o rechazada: `not_waiting`; retirada: `gone`; cerrada: `closed`; bloqueada: `you_blocked`; ajena: `not_found`', async () => {
    const accepted = await scene()
    await accept(accepted.publisher, accepted.id)
    expect((await ask(accepted.publisher, accepted.id, '¿Y?')).outcome).toBe('not_waiting')

    const rejected = await scene()
    await reject(rejected.publisher, rejected.id, 'housing')
    expect((await ask(rejected.publisher, rejected.id, '¿Y?')).outcome).toBe('not_waiting')

    const gone = await scene()
    await withdraw(gone.applicant, gone.id)
    expect((await ask(gone.publisher, gone.id, '¿Y?')).outcome).toBe('gone')

    const adopted = await scene('closed', { closeReason: 'adopted' })
    expect(await ask(adopted.publisher, adopted.id, '¿Y?')).toMatchObject({
      outcome: 'closed',
      close_reason: 'adopted',
    })

    const blocked = await scene()
    await block(blocked.publisher.id, blocked.applicant.id)
    expect((await ask(blocked.publisher, blocked.id, '¿Y?')).outcome).toBe('you_blocked')

    const other = await person(1, 'Otra publicadora')
    expect((await ask(other, accepted.id, '¿Y?')).outcome).toBe('not_found')
    for (const id of [accepted.id, rejected.id, gone.id, adopted.id, blocked.id]) {
      // oxlint-disable-next-line no-await-in-loop -- pocas, y el orden no importa
      expect(await questionsOf(id)).toEqual([])
    }
  })
})

describeDb('contestar', () => {
  // Covers: US3-AS6, FR-030 (una sola vez, no se cambia)
  it('una vez: la segunda dice que ya estaba y no cambia la respuesta', async () => {
    const { publisher, applicant, id } = await scene()
    await ask(publisher, id, '¿El balcón tiene red?')
    const question = await pendingQuestion(id)
    const answered = await answer(applicant, question, 'Sí, en todo el balcón.')
    expect(answered).toMatchObject({ outcome: 'answered', application_id: id })
    expect(answered.asked_at).not.toBeNull()
    expect((await answer(applicant, question, 'Cambié de idea')).outcome).toBe('already_answered')
    expect((await questionsOf(id))[0]?.answer).toBe('Sí, en todo el balcón.')
  })

  // Covers: FR-034, FR-030 (vacía, solo espacios, 500/501)
  it('vacía, de solo espacios o de más de 500 no entra; de 500 sí', async () => {
    const { publisher, applicant, id } = await scene()
    await ask(publisher, id, '¿Trabajás afuera?')
    const question = await pendingQuestion(id)
    for (const text of ['', '  ', 'a'.repeat(QUESTION_MAX_LENGTH + 1)]) {
      // oxlint-disable-next-line no-await-in-loop -- pocas, y el orden no importa
      expect((await answer(applicant, question, text)).outcome).toBe('invalid')
    }
    expect((await questionsOf(id))[0]?.answer).toBeNull()
    expect((await answer(applicant, question, 'a'.repeat(QUESTION_MAX_LENGTH))).outcome).toBe(
      'answered',
    )
  })

  // Covers: edge «aceptar mientras hay una pregunta esperando», FR-032
  it('aceptada con la pregunta pendiente, todavía se contesta', async () => {
    const { publisher, applicant, id } = await scene()
    await ask(publisher, id, '¿Tenés otros animales?')
    await accept(publisher, id)
    expect((await answer(applicant, await pendingQuestion(id), 'Una gata')).outcome).toBe(
      'answered',
    )
  })

  // Covers: edge «contestar una que se cerró o se rechazó mientras escribía», FR-032
  it('rechazada, retirada o cerrada mientras escribía: `not_active`, sin guardar', async () => {
    const rejected = await scene()
    await ask(rejected.publisher, rejected.id, '¿Y?')
    const rejectedQuestion = await pendingQuestion(rejected.id)
    await reject(rejected.publisher, rejected.id, 'no_answer')
    expect((await answer(rejected.applicant, rejectedQuestion, 'Sí')).outcome).toBe('not_active')

    const withdrawn = await scene()
    await ask(withdrawn.publisher, withdrawn.id, '¿Y?')
    const withdrawnQuestion = await pendingQuestion(withdrawn.id)
    await withdraw(withdrawn.applicant, withdrawn.id)
    expect((await answer(withdrawn.applicant, withdrawnQuestion, 'Sí')).outcome).toBe('not_active')

    const closed = await scene()
    await ask(closed.publisher, closed.id, '¿Y?')
    const closedQuestion = await pendingQuestion(closed.id)
    await block(closed.applicant.id, closed.publisher.id)
    expect((await answer(closed.applicant, closedQuestion, 'Sí')).outcome).toBe('not_active')

    for (const id of [rejected.id, withdrawn.id, closed.id]) {
      // oxlint-disable-next-line no-await-in-loop -- pocas, y el orden no importa
      expect((await questionsOf(id))[0]?.answer).toBeNull()
    }
  })

  // Covers: FR-070 (la pregunta de otra solicitud no existe)
  it('la pregunta de otra persona, o una que no existe: `not_found`', async () => {
    const { publisher, id } = await scene()
    await ask(publisher, id, '¿Y?')
    const question = await pendingQuestion(id)
    const other = await person(1, 'Otra solicitante')
    expect((await answer(other, question, 'Sí')).outcome).toBe('not_found')
    expect((await answer(publisher, question, 'Sí')).outcome).toBe('not_found')
    expect((await answer(other, crypto.randomUUID(), 'Sí')).outcome).toBe('not_found')
    expect((await questionsOf(id))[0]?.answer).toBeNull()
  })
})

describeDb('el hilo lo leen las dos personas (FR-033)', () => {
  // Covers: FR-033, FR-081, SC-002
  it('quien solicitó y el publicador, en orden; otra persona, quien administra y un visitante, nada', async () => {
    const { publisher, applicant, id } = await scene()
    await ask(publisher, id, 'Primera')
    await answer(applicant, await pendingQuestion(id), 'Uno')
    await ask(publisher, id, 'Segunda')

    for (const client of [applicant.client, publisher.client]) {
      // oxlint-disable-next-line no-await-in-loop -- dos lecturas, el orden no importa
      const { rows, error } = await questionsAs(client, id)
      expect(error).toBeNull()
      expect(rows.map((row) => [row.position, row.question, row.answer])).toEqual([
        [1, 'Primera', 'Uno'],
        [2, 'Segunda', null],
      ])
    }

    const other = await person(1, 'Otra persona')
    const moderator = await admin()
    for (const client of [other.client, moderator.client, anonClient(), applicant.client]) {
      // oxlint-disable-next-line no-await-in-loop -- pocas, el orden no importa
      const table = await client.from('application_questions').select('*')
      expect(table.data ?? []).toEqual([])
    }
    for (const client of [other.client, moderator.client, anonClient()]) {
      // oxlint-disable-next-line no-await-in-loop -- pocas, el orden no importa
      expect((await questionsAs(client, id)).rows).toEqual([])
    }
  })

  // Covers: FR-043 (de un animal dado de baja, el publicador no ve el hilo)
  it('de un animal dado de baja, el publicador ya no lee el hilo; quien solicitó, sí', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await ask(publisher, id, '¿Y?')
    await setState(pet.petId, 'taken_down')
    expect((await questionsAs(publisher.client, id)).rows).toEqual([])
    expect((await questionsAs(applicant.client, id)).rows).toHaveLength(1)
  })
})

describeDb('por qué se cerró, del lado del publicador (US4, FR-042)', () => {
  async function closeOf(publisher: { client: Parameters<typeof publisherViewAs>[0] }, id: string) {
    const { rows } = await publisherViewAs(publisher.client, id)
    return rows[0]?.publisher_close ?? null
  }

  // Covers: US4-AS3, FR-042, SC-008 (retiro, bloqueo y suspensión de quien solicitó: el mismo texto)
  it('retirada, el bloqueo de quien solicitó y su suspensión son el mismo `gone`', async () => {
    const [withdrawn, blocked, suspended] = await Promise.all([scene(), scene(), scene()])
    await withdraw(withdrawn.applicant, withdrawn.id)
    await block(blocked.applicant.id, blocked.publisher.id)
    await suspend(suspended.applicant.id)
    for (const { publisher, id } of [withdrawn, blocked, suspended]) {
      // oxlint-disable-next-line no-await-in-loop -- tres caminos, de a uno
      expect(await closeOf(publisher, id)).toBe('gone')
    }
  })

  // Covers: US4-AS4, FR-042 (el bloqueo del publicador, también cuando el otro bloqueó primero)
  it('el bloqueo del publicador es `you_blocked`, también si quien solicitó lo había bloqueado antes', async () => {
    const mine = await scene()
    await block(mine.publisher.id, mine.applicant.id)
    expect(await closeOf(mine.publisher, mine.id)).toBe('you_blocked')
    const [row] = await applicationsOf(mine.applicant.id)
    expect(row?.close_reason).toBe('not_receiving')

    const mutual = await scene()
    await block(mutual.applicant.id, mutual.publisher.id)
    expect(await closeOf(mutual.publisher, mutual.id)).toBe('gone')
    await block(mutual.publisher.id, mutual.applicant.id)
    expect(await closeOf(mutual.publisher, mutual.id)).toBe('you_blocked')
  })

  // Covers: US4-AS1, US4-AS6, FR-040 (los cierres del animal, con su motivo y sin acciones)
  it('adoptado o dado de baja: su motivo, y ninguna respuesta lo cambia', async () => {
    const adopted = await scene()
    await markAccepted(adopted.id)
    await setState(adopted.pet.petId, 'adopted')
    expect(await closeOf(adopted.publisher, adopted.id)).toBe('adopted')
    expect((await accept(adopted.publisher, adopted.id)).outcome).toBe('closed')
    expect((await reject(adopted.publisher, adopted.id, 'housing')).outcome).toBe('closed')
    expect((await revoke(adopted.publisher, adopted.id, 'not_concluded')).outcome).toBe('closed')
    expect((await ask(adopted.publisher, adopted.id, '¿Y?')).outcome).toBe('closed')

    const takenDown = await scene()
    await setState(takenDown.pet.petId, 'taken_down')
    expect(await closeOf(takenDown.publisher, takenDown.id)).toBe('unpublished')
    const [row] = await applicationsOf(adopted.applicant.id)
    expect(row?.status).toBe('closed')
  })
})
