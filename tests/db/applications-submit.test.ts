// Enviar una solicitud (historia #63): la base repite los controles de FR-003 en su orden y con el
// candado de la cuenta, y guarda una sola por intento (research R1, R2).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  ANSWERS,
  applicationPeople,
  applicationsOf,
  insertApplication,
  petOf,
  submit,
  withdraw,
} from './applications-support'
import { block, suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'
import { pauseLevel } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, publisherWithPet } = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('submit_application: enviar', () => {
  // Covers: US1-AS1, FR-032, FR-080
  it('con nivel 1 y un animal que recibe: queda enviada, con el animal, el publicador y el nombre', async () => {
    const { publisher, pet } = await publisherWithPet({ name: 'Tobi' })
    const applicant = await person(1)

    const sent = await submit(applicant, pet.code)

    expect(sent.outcome).toBe('sent')
    const [row] = await applicationsOf(applicant.id)
    expect(row).toMatchObject({
      id: sent.application_id,
      pet_id: pet.petId,
      publisher_id: publisher.id,
      pet_name: 'Tobi',
      status: 'sent',
      close_reason: null,
      answers: ANSWERS,
    })
  })

  // Covers: US1-AS11, FR-031, SC-003
  it('el mismo intento dos veces: una sola solicitud, y el segundo dice cuál', async () => {
    const { pet } = await publisherWithPet()
    const applicant = await person(1)
    const attempt = crypto.randomUUID()

    const [first, second] = await Promise.all([
      submit(applicant, pet.code, { attempt }),
      submit(applicant, pet.code, { attempt }),
    ])

    expect([first.outcome, second.outcome].toSorted()).toEqual(['already', 'sent'])
    expect(first.application_id).toBe(second.application_id)
    expect(await applicationsOf(applicant.id)).toHaveLength(1)
  })

  // Covers: FR-050, spec §Edge Cases «Dos pestañas mandando por el mismo animal»
  it('una segunda activa por el mismo animal: has_active, con la que ya tiene', async () => {
    const { pet } = await publisherWithPet()
    const applicant = await person(1)
    const sent = await submit(applicant, pet.code)

    const again = await submit(applicant, pet.code)

    expect(again).toEqual({ outcome: 'has_active', application_id: sent.application_id })
    expect(await applicationsOf(applicant.id)).toHaveLength(1)
  })

  // Covers: US1-AS9
  it('el propio animal: own', async () => {
    const { publisher, pet } = await publisherWithPet()
    expect(await submit(publisher, pet.code)).toEqual({ outcome: 'own', application_id: null })
  })

  // Covers: US1-AS3, FR-014
  it('sin teléfono verificado, o con un cambio a medias: needs_phone', async () => {
    const { pet } = await publisherWithPet()
    const withoutPhone = await person(0)
    const changing = await person(1)
    await pauseLevel(changing.id)

    expect((await submit(withoutPhone, pet.code)).outcome).toBe('needs_phone')
    expect((await submit(changing, pet.code)).outcome).toBe('needs_phone')
    expect(await applicationsOf(withoutPhone.id)).toEqual([])
  })

  it('un código que no existe: not_found', async () => {
    const applicant = await person(1)
    expect((await submit(applicant, 'zzzzzzzzzz')).outcome).toBe('not_found')
  })

  // Covers: FR-030, spec §Edge Cases «El animal deja de estar a la vista mientras contesto»
  it('pausada, vencida o con el publicador sin nivel 1: unavailable', async () => {
    const applicant = await person(1)
    const paused = await publisherWithPet({ state: 'paused' })
    const expired = await publisherWithPet({ state: 'expired' })
    const lostLevel = await publisherWithPet()
    await pauseLevel(lostLevel.publisher.id)

    for (const { pet } of [paused, expired, lostLevel]) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, la misma persona
      expect((await submit(applicant, pet.code)).outcome).toBe('unavailable')
    }
    expect(await applicationsOf(applicant.id)).toEqual([])
  })

  // Covers: US1-AS13, FR-030, FR-063, spec §Edge Cases «El animal se borra, se da de baja…»
  it('adoptada, dada de baja, publicador suspendido o bloqueada por el publicador: not_receiving', async () => {
    const applicant = await person(1)
    const adopted = await publisherWithPet({ state: 'adopted' })
    const takenDown = await publisherWithPet({ state: 'taken_down' })
    const suspended = await publisherWithPet()
    await suspend(suspended.publisher.id)
    const blocking = await publisherWithPet()
    await block(blocking.publisher.id, applicant.id)

    for (const { pet } of [adopted, takenDown, suspended, blocking]) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, la misma persona
      expect((await submit(applicant, pet.code)).outcome).toBe('not_receiving')
    }
    expect(await applicationsOf(applicant.id)).toEqual([])
  })

  // Covers: FR-063, spec §Edge Cases «Bloqueo mutuo»
  it('quien bloqueó al publicador: you_blocked, también en un bloqueo mutuo', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    await block(applicant.id, publisher.id)
    expect((await submit(applicant, pet.code)).outcome).toBe('you_blocked')

    await block(publisher.id, applicant.id)
    expect((await submit(applicant, pet.code)).outcome).toBe('you_blocked')
  })

  // Covers: FR-005
  it('un animal en proceso recibe solicitudes', async () => {
    const { pet } = await publisherWithPet({ state: 'in_process' })
    const applicant = await person(1)
    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
  })

  // Covers: FR-021, FR-022, spec §Edge Cases «El animal cambia de castrado mientras contesto»
  it('respuestas que no corresponden al animal: answers_invalid, y no se guarda nada', async () => {
    const applicant = await person(1)
    const { pet } = await publisherWithPet({ neutered: false })
    const invalid = [
      ANSWERS,
      { ...ANSWERS, neuter_commitment: 'yes', phone: '099123456' },
      { ...ANSWERS, neuter_commitment: 'yes', housing_tenure: 'rented' },
      { ...ANSWERS, neuter_commitment: 'yes', experience: 'a'.repeat(501) },
      { ...ANSWERS, neuter_commitment: 'yes', household: '   ' },
    ]

    for (const answers of invalid) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, la misma persona
      expect((await submit(applicant, pet.code, { answers })).outcome).toBe('answers_invalid')
    }
    expect(await applicationsOf(applicant.id)).toEqual([])
    expect(
      (await submit(applicant, pet.code, { answers: { ...ANSWERS, neuter_commitment: 'yes' } }))
        .outcome,
    ).toBe('sent')
  })

  // Covers: FR-013 (lo enviado no cambia con el nivel exigido) y el orden de FR-003
  it('el animal es lo primero: con una activa, un animal pausado dice unavailable', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    await insertApplication(applicant, pet, publisher)
    const { error } = await db()
      .from('pets')
      .update({ status: 'paused', expires_at: null })
      .eq('id', pet.petId)
    expect(error).toBeNull()

    expect((await submit(applicant, pet.code)).outcome).toBe('unavailable')
  })

  it('una solicitud por otro animal del mismo publicador es otra solicitud', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const other = await petOf(publisher, { name: 'Luna' })

    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
    expect((await submit(applicant, other.code)).outcome).toBe('sent')
    expect(await applicationsOf(applicant.id)).toHaveLength(2)
  })
})

describeDb('submit_application: el límite de 3', () => {
  // Covers: US2-AS2, FR-050
  it('con tres activas, la cuarta: limit, y no se guarda', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const others = await Promise.all(
      ['Luna', 'Michi', 'Nube'].map((name) => petOf(publisher, { name })),
    )
    await Promise.all(others.map((other) => insertApplication(applicant, other, publisher)))

    expect(await submit(applicant, pet.code)).toEqual({ outcome: 'limit', application_id: null })
    expect(await applicationsOf(applicant.id)).toHaveLength(3)
  })

  // Covers: FR-050 (el límite cuenta solo las activas)
  it('las retiradas y las cerradas no cuentan', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const others = await Promise.all(
      ['Luna', 'Michi', 'Nube', 'Sol'].map((name) => petOf(publisher, { name })),
    )
    await insertApplication(applicant, others[0], publisher)
    await insertApplication(applicant, others[1], publisher)
    await insertApplication(applicant, others[2], publisher, { status: 'withdrawn' })
    await insertApplication(applicant, others[3], publisher, {
      status: 'closed',
      close_reason: 'adopted',
    })

    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
  })

  // Covers: US2-AS3, FR-050, spec §Edge Cases «Dos pestañas»
  it('dos sesiones a la vez con dos activas: una entra, la otra limit, y quedan 3', async () => {
    const applicant = await person(1)
    const { publisher } = await publisherWithPet()
    const pets = await Promise.all(
      ['Tobi', 'Luna', 'Michi', 'Nube'].map((name) => petOf(publisher, { name })),
    )
    await insertApplication(applicant, pets[0], publisher)
    await insertApplication(applicant, pets[1], publisher)

    const results = await Promise.all([
      submit(applicant, pets[2].code),
      submit(applicant, pets[3].code),
    ])

    expect(results.map((result) => result.outcome).toSorted()).toEqual(['limit', 'sent'])
    const rows = await applicationsOf(applicant.id)
    expect(rows.filter((row) => row.status === 'sent')).toHaveLength(3)
  })
})

describeDb('withdraw_application: retirar', () => {
  // Covers: US2-AS4, FR-052
  it('una activa propia: withdrawn, con la fecha de envío y el animal, y deja de contar', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const id = await insertApplication(applicant, pet, publisher)
    const [before] = await applicationsOf(applicant.id)

    const result = await withdraw(applicant, id)

    expect(result).toEqual({
      outcome: 'withdrawn',
      close_reason: null,
      sent_at: before?.sent_at,
      code: pet.code,
    })
    const [row] = await applicationsOf(applicant.id)
    expect(row).toMatchObject({ id, status: 'withdrawn', close_reason: null })
    expect(Date.parse(row?.changed_at ?? '')).toBeGreaterThanOrEqual(
      Date.parse(before?.changed_at ?? ''),
    )
    expect(row?.changed_at).not.toBe(before?.changed_at)
  })

  // Covers: spec §Edge Cases «Retirar dos veces»
  it('dos veces: la segunda already_withdrawn, sin cambiar nada', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const id = await insertApplication(applicant, pet, publisher)
    await withdraw(applicant, id)
    const [first] = await applicationsOf(applicant.id)

    expect(await withdraw(applicant, id)).toEqual({
      outcome: 'already_withdrawn',
      close_reason: null,
      sent_at: null,
      code: null,
    })
    expect(await applicationsOf(applicant.id)).toEqual([first])
  })

  // Covers: FR-070 (la ajena se ve como inexistente)
  it('la de otra persona o una que no existe: not_found, y la ajena sigue activa', async () => {
    const applicant = await person(1)
    const other = await person(1, 'Otra persona')
    const { publisher, pet } = await publisherWithPet()
    const id = await insertApplication(applicant, pet, publisher)

    expect((await withdraw(other, id)).outcome).toBe('not_found')
    expect((await withdraw(publisher, id)).outcome).toBe('not_found')
    expect((await withdraw(applicant, crypto.randomUUID())).outcome).toBe('not_found')
    expect((await applicationsOf(applicant.id)).map((row) => row.status)).toEqual(['sent'])
  })

  // Covers: spec §Edge Cases «Retirar una solicitud que se cerró mientras tanto»
  it('una cerrada: closed con su motivo, y sigue cerrada', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const id = await insertApplication(applicant, pet, publisher, {
      status: 'closed',
      close_reason: 'adopted',
    })

    expect(await withdraw(applicant, id)).toEqual({
      outcome: 'closed',
      close_reason: 'adopted',
      sent_at: null,
      code: null,
    })
    expect(await applicationsOf(applicant.id)).toMatchObject([
      { status: 'closed', close_reason: 'adopted' },
    ])
  })

  // Covers: spec §Edge Cases «Retirar con el animal pausado o vencido»
  it('con el animal pausado se puede retirar', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const id = await insertApplication(applicant, pet, publisher)
    const { error } = await db()
      .from('pets')
      .update({ status: 'paused', expires_at: null })
      .eq('id', pet.petId)
    expect(error).toBeNull()

    expect((await withdraw(applicant, id)).outcome).toBe('withdrawn')
  })

  // Covers: US2-AS6, FR-052
  it('después de retirar se puede volver a enviar, y la retirada queda como retirada', async () => {
    const applicant = await person(1)
    const { pet } = await publisherWithPet()
    const first = await submit(applicant, pet.code)
    await withdraw(applicant, first.application_id ?? '')

    const again = await submit(applicant, pet.code)

    expect(again.outcome).toBe('sent')
    expect(again.application_id).not.toBe(first.application_id)
    expect((await applicationsOf(applicant.id)).map((row) => [row.id, row.status])).toEqual([
      [first.application_id, 'withdrawn'],
      [again.application_id, 'sent'],
    ])
  })

  // Covers: US2-AS2, FR-051 (retirar en el límite libera el lugar)
  it('con tres activas, retirar una deja enviar la cuarta', async () => {
    const applicant = await person(1)
    const { publisher, pet } = await publisherWithPet()
    const others = await Promise.all(
      ['Luna', 'Michi', 'Nube'].map((name) => petOf(publisher, { name })),
    )
    const ids = await Promise.all(
      others.map((other) => insertApplication(applicant, other, publisher)),
    )
    expect((await submit(applicant, pet.code)).outcome).toBe('limit')

    await withdraw(applicant, ids[0] ?? '')

    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
  })
})
