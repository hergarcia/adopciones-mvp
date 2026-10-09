// El nivel exigido y las reglas del cuestionario (historia #63). La base valida con los mismos
// números y las mismas preguntas que lib/applications/ (research R4), guarda quién puede solicitar
// al publicar y al editar (R9), y el pedido de identidad recuerda desde qué animal se hizo (R10).
import { afterEach, describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../src/lib/applications/questionnaire'
import { ANSWER_MAX_LENGTH, MAX_ACTIVE_APPLICATIONS } from '../../src/lib/applications/rules'
import { validateApplication } from '../../src/lib/schemas/application'
import { IDENTITY_DB_RULES } from '../../src/lib/verification/rules'
import { describeDb } from '../setup/env-report'
import {
  ANSWERS,
  applicationPeople,
  applicationsOf,
  insertApplication,
  petOf,
  submit,
  viewAs,
} from './applications-support'
import { FRONT, SELFIE } from './identity-support'
import { sql } from './listing-support'
import { FIELDS, PENDING_TTL, STAGED_TTL, stagedPhotos } from './pet-support'
import { db, firstRow } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, publisherWithPet } = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`

async function dbAccepts(answers: unknown, neutered: boolean): Promise<boolean> {
  const [row] = await sql<{ valid: boolean }>(
    `select private.application_answers_valid(${literal(answers)}, ${neutered}) as valid`,
  )
  return row?.valid ?? false
}

describeDb('las reglas de la base son las de lib/applications/', () => {
  // Covers: FR-050, FR-021 (paridad de los números)
  it('3 activas y 500 caracteres', async () => {
    const [row] = await sql<{ max: number; length: number }>(
      'select private.max_active_applications() as max, private.answer_max_length() as length',
    )
    expect(row).toEqual({ max: MAX_ACTIVE_APPLICATIONS, length: ANSWER_MAX_LENGTH })
  })

  // Covers: FR-020, FR-026 (paridad del cuestionario)
  it('las mismas preguntas, en el mismo orden, con las mismas opciones', async () => {
    const rows = await sql<{ id: string; kind: string; options: string[] | null }>(
      'select id, kind, options from private.application_questions()',
    )
    expect(rows).toEqual(
      QUESTIONS.map((question) => ({
        id: question.id,
        kind: question.kind,
        options: question.kind === 'choice' ? [...question.options] : null,
      })),
    )
  })

  // Covers: FR-021, FR-022 (la base acepta y rechaza lo mismo que el schema)
  describe('application_answers_valid y validateApplication dicen lo mismo', () => {
    const cases: { name: string; answers: Record<string, unknown>; neutered: boolean }[] = [
      { name: 'completo, castrado', answers: ANSWERS, neutered: true },
      {
        name: 'sin castrar con compromiso',
        answers: { ...ANSWERS, neuter_commitment: 'yes' },
        neutered: false,
      },
      { name: 'sin castrar sin compromiso', answers: ANSWERS, neutered: false },
      {
        name: 'alquilada con permiso',
        answers: { ...ANSWERS, housing_tenure: 'rented', rental_allows_pets: 'no' },
        neutered: true,
      },
      {
        name: 'alquilada sin permiso',
        answers: { ...ANSWERS, housing_tenure: 'rented' },
        neutered: true,
      },
      {
        name: 'una opción desconocida',
        answers: { ...ANSWERS, vet_budget: 'mucha' },
        neutered: true,
      },
      {
        name: '500 caracteres',
        answers: { ...ANSWERS, experience: 'a'.repeat(ANSWER_MAX_LENGTH) },
        neutered: true,
      },
      {
        name: '501 caracteres',
        answers: { ...ANSWERS, experience: 'a'.repeat(ANSWER_MAX_LENGTH + 1) },
        neutered: true,
      },
      { name: 'solo espacios', answers: { ...ANSWERS, household: '   ' }, neutered: true },
      {
        name: 'una pregunta que falta',
        answers: { ...ANSWERS, household: undefined },
        neutered: true,
      },
    ]

    it.each(cases)('$name', async ({ answers, neutered }) => {
      const schema = validateApplication(answers, { isNeutered: neutered })
      expect(await dbAccepts(answers, neutered)).toBe(schema.ok)
    })
  })

  // Covers: FR-022 (la base, que es la última puerta, no acepta lo que el schema descartaría)
  it('una condicional que no corresponde, o una clave de más, no pasan en la base', async () => {
    expect(await dbAccepts({ ...ANSWERS, rental_allows_pets: 'yes' }, true)).toBe(false)
    expect(await dbAccepts({ ...ANSWERS, neuter_commitment: 'yes' }, true)).toBe(false)
    expect(await dbAccepts({ ...ANSWERS, phone: '099123456' }, true)).toBe(false)
    expect(await dbAccepts({ ...ANSWERS, household: 3 }, true)).toBe(false)
    expect(await dbAccepts([ANSWERS], true)).toBe(false)
  })
})

async function requiredLevelOf(petId: string): Promise<number | undefined> {
  const { data, error } = await db().from('pets').select('required_level').eq('id', petId).single()
  expect(error).toBeNull()
  return data?.required_level
}

async function publishWith(ownerId: string, extra: Record<string, unknown>): Promise<string> {
  const { data, error } = await db().rpc('publish_pet', {
    p_owner: ownerId,
    p_attempt: crypto.randomUUID(),
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: { ...FIELDS, ...extra },
    p_photo_ids: await stagedPhotos(ownerId, 1),
  })
  expect(error).toBeNull()
  return firstRow(data, 'publish_pet').pet_id
}

async function saveWith(ownerId: string, petId: string, extra: Record<string, unknown>) {
  const { data: photos } = await db().from('pet_photos').select('id').eq('pet_id', petId)
  const { error } = await db().rpc('save_pet', {
    p_owner: ownerId,
    p_pet: petId,
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: { ...FIELDS, ...extra },
    p_photo_ids: (photos ?? []).map((photo) => photo.id),
  })
  expect(error).toBeNull()
}

describeDb('quién puede solicitar, al publicar y al editar', () => {
  // Covers: US3-AS1, US3-AS2, FR-010
  it('publish_pet guarda identidad verificada, y sin el campo queda en teléfono', async () => {
    const owner = await person(1, 'Quien publica')

    expect(await requiredLevelOf(await publishWith(owner.id, { required_level: 2 }))).toBe(2)
    expect(await requiredLevelOf(await publishWith(owner.id, { required_level: 1 }))).toBe(1)
    expect(await requiredLevelOf(await publishWith(owner.id, {}))).toBe(1)
  })

  // Covers: US3-AS6, FR-010
  it('save_pet lo cambia en los dos sentidos, y sin el campo vuelve a teléfono', async () => {
    const owner = await person(1, 'Quien publica')
    const petId = await publishWith(owner.id, {})

    await saveWith(owner.id, petId, { required_level: 2 })
    expect(await requiredLevelOf(petId)).toBe(2)
    await saveWith(owner.id, petId, { required_level: 1 })
    expect(await requiredLevelOf(petId)).toBe(1)
    await saveWith(owner.id, petId, { required_level: 2 })
    await saveWith(owner.id, petId, {})
    expect(await requiredLevelOf(petId)).toBe(1)
  })

  // Covers: US3-AS5, FR-013
  it('pasar a identidad no toca las solicitudes ya enviadas', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await insertApplication(applicant, pet, publisher)

    await saveWith(publisher.id, pet.petId, { required_level: 2 })

    expect(await applicationsOf(applicant.id)).toMatchObject([
      { id, status: 'sent', close_reason: null },
    ])
  })
})

describeDb('enviar a un animal que pide identidad verificada', () => {
  // Covers: US3-AS3, FR-011
  it('con solo el teléfono, needs_identity y nada guardado', async () => {
    const { pet } = await publisherWithPet({ requiredLevel: 2, neutered: true })
    const applicant = await person(1)

    expect(await submit(applicant, pet.code)).toEqual({
      outcome: 'needs_identity',
      application_id: null,
    })
    expect(await applicationsOf(applicant.id)).toEqual([])
  })

  // Covers: US3-AS7
  it('con identidad verificada, se envía directo', async () => {
    const { pet } = await publisherWithPet({ requiredLevel: 2, neutered: true })
    const applicant = await person(2)

    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
  })

  // Covers: FR-001 (la ficha dice el nivel antes de tocar nada)
  it('pet_application_view dice el nivel con y sin sesión', async () => {
    const { publisher, pet } = await publisherWithPet({ requiredLevel: 2 })
    const applicant = await person(2)
    const id = await insertApplication(applicant, pet, publisher)

    expect((await viewAs(anonClient(), pet.code)).rows).toEqual([
      { required_level: 2, receives: true, my_active_id: null, my_rejected: false },
    ])
    expect((await viewAs(applicant.client, pet.code)).rows).toEqual([
      { required_level: 2, receives: true, my_active_id: id, my_rejected: false },
    ])
  })
})

async function requestIdentity(userId: string, returnCode?: string) {
  const { data, error } = await db().rpc('submit_identity_request', {
    p_user_id: userId,
    p_origin: 'profile',
    p_front: FRONT,
    p_selfie: SELFIE,
    ...IDENTITY_DB_RULES,
    ...(returnCode === undefined ? {} : { p_return_code: returnCode }),
  })
  expect(error).toBeNull()
  const row = firstRow(data, 'submit_identity_request')
  expect(row.decision).toBe('sent')
  return row.request_id ?? ''
}

async function returnPetOf(requestId: string) {
  const { data, error } = await db()
    .from('identity_requests')
    .select('return_pet_id')
    .eq('id', requestId)
    .single()
  expect(error).toBeNull()
  return data?.return_pet_id
}

async function approve(requestId: string, adminId: string) {
  const { data, error } = await db().rpc('resolve_identity_request', {
    p_request_id: requestId,
    p_admin: adminId,
    p_outcome: 'approve',
    p_window_days: IDENTITY_DB_RULES.p_window_days,
    p_cap: IDENTITY_DB_RULES.p_cap,
    p_pending_ttl: IDENTITY_DB_RULES.p_pending_ttl,
  })
  expect(error).toBeNull()
  return firstRow(data, 'resolve_identity_request')
}

describeDb('el pedido de identidad recuerda el animal desde el que se pidió', () => {
  // Covers: US3-AS3, FR-012
  it('con el código, el pedido apunta al animal y la aprobación devuelve su código y su nombre', async () => {
    const { pet } = await publisherWithPet({ requiredLevel: 2, name: 'Luna' })
    const applicant = await person(1)
    const reviewer = await admin()

    const requestId = await requestIdentity(applicant.id, pet.code)
    expect(await returnPetOf(requestId)).toBe(pet.petId)

    expect(await approve(requestId, reviewer.id)).toMatchObject({
      decision: 'approved',
      return_code: pet.code,
      return_name: 'Luna',
    })
  })

  // Covers: FR-012 (un código que no existe no frena el pedido)
  it('sin código o con uno que no existe, el pedido sale igual y sin animal', async () => {
    const reviewer = await admin()
    const [withoutCode, unknownCode] = await Promise.all([person(1), person(1)])

    const first = await requestIdentity(withoutCode.id)
    const second = await requestIdentity(unknownCode.id, 'zzzz000000')

    expect(await returnPetOf(first)).toBeNull()
    expect(await returnPetOf(second)).toBeNull()
    expect(await approve(first, reviewer.id)).toMatchObject({
      decision: 'approved',
      return_code: null,
      return_name: null,
    })
  })

  // Covers: FR-012, Edge Cases (el animal se borró antes de la aprobación)
  it('si el animal se borra antes de aprobar, el correo es el de siempre', async () => {
    const owner = await person(1, 'Quien publica')
    const pet = await petOf(owner, { requiredLevel: 2 })
    const applicant = await person(1)
    const reviewer = await admin()
    const requestId = await requestIdentity(applicant.id, pet.code)

    const { error } = await db().from('pets').delete().eq('id', pet.petId)
    expect(error).toBeNull()

    expect(await returnPetOf(requestId)).toBeNull()
    expect(await approve(requestId, reviewer.id)).toMatchObject({
      decision: 'approved',
      return_code: null,
      return_name: null,
    })
  })
})
