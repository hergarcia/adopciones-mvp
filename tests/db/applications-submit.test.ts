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
