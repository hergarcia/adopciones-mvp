// La bandeja de salida de los correos de una solicitud (historia #65, research R3 y R6): qué escribe
// cada camino, que el correo de solicitud nueva no se repite mientras el publicador no mira, y que
// vaciarla entrega cada aviso una sola vez.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  accept,
  answer,
  ask,
  markAccepted,
  noticesOf,
  open,
  reject,
  responsePeople,
  revoke,
  visit,
} from './application-responses-support'
import { insertApplication, petOf, submit, withdraw } from './applications-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, scene, publisherWithPet } = responsePeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function applicants(count: number) {
  return Promise.all(Array.from({ length: count }, (_, index) => person(1, `Solicitante ${index}`)))
}

async function sentIds(code: string, people: { id: string }[]): Promise<string[]> {
  const ids: string[] = []
  for (const applicant of people) {
    // oxlint-disable-next-line no-await-in-loop -- en orden: la regla depende de cuál llegó antes
    const row = await submit(applicant, code)
    expect(row.outcome).toBe('sent')
    ids.push(row.application_id ?? '')
  }
  return ids
}

async function kindsOf(ids: string[]) {
  return (await noticesOf(ids)).map((notice) => notice.kind)
}

describeDb('el correo de solicitud nueva (R6, FR-060)', () => {
  // Covers: US1-AS1, US1-AS15
  it('la primera avisa; mientras haya una nueva sin mirar, las siguientes no', async () => {
    const { publisher, pet } = await publisherWithPet()
    const ids = await sentIds(pet.code, await applicants(3))

    const notices = await noticesOf(ids)
    expect(notices).toEqual([
      { kind: 'new_application', application_id: ids[0], recipient_id: publisher.id },
    ])
  })

  // Covers: US1-AS15 (abrir Solicitudes vuelve a habilitar el correo)
  it('después de abrir Solicitudes, la próxima nueva avisa', async () => {
    const { publisher, pet } = await publisherWithPet()
    const people = await applicants(3)
    const first = await sentIds(pet.code, people.slice(0, 2))
    await visit(publisher)
    const [third] = await sentIds(pet.code, people.slice(2))
    expect(await kindsOf([...first, third ?? ''])).toEqual(['new_application', 'new_application'])
  })

  // Covers: edge «las de otro animal mandan su propio correo», visitar solo ese animal
  it('cada animal cuenta lo suyo, y visitar las de uno no habilita las del otro', async () => {
    const { publisher, pet } = await publisherWithPet()
    const other = await petOf(publisher, { name: 'Luna' })
    const people = await applicants(4)
    const tobi = await sentIds(pet.code, people.slice(0, 1))
    const luna = await sentIds(other.code, people.slice(1, 2))
    expect(await kindsOf([...tobi, ...luna])).toEqual(['new_application', 'new_application'])

    await visit(publisher, other.petId)
    const tobiAgain = await sentIds(pet.code, people.slice(2, 3))
    const lunaAgain = await sentIds(other.code, people.slice(3, 4))
    expect(await kindsOf(tobiAgain)).toEqual([])
    expect(await kindsOf(lunaAgain)).toEqual(['new_application'])
  })

  // Covers: FR-005 (una abierta ya no es nueva y no frena el correo)
  it('si la nueva ya se abrió, la siguiente avisa', async () => {
    const { publisher, pet } = await publisherWithPet()
    const people = await applicants(2)
    const [first] = await sentIds(pet.code, people.slice(0, 1))
    await open(publisher, first ?? '')
    const second = await sentIds(pet.code, people.slice(1))
    expect(await kindsOf(second)).toEqual(['new_application'])
  })
})

describeDb('aceptar avisa a quien solicitó', () => {
  // Covers: US1-AS3, FR-061, FR-064
  it('un aviso, aunque se toque dos veces', async () => {
    const { publisher, applicant, id } = await scene()
    await accept(publisher, id)
    await accept(publisher, id)
    expect(await noticesOf([id])).toEqual([
      { kind: 'accepted', application_id: id, recipient_id: applicant.id },
    ])
  })

  // Covers: FR-044 (una que ya no espera no escribe)
  it('una retirada no avisa', async () => {
    const { publisher, id } = await scene('withdrawn')
    await accept(publisher, id)
    expect(await noticesOf([id])).toEqual([])
  })
})

describeDb('rechazar y dejar sin efecto avisan a quien solicitó', () => {
  // Covers: US2-AS1, FR-061, FR-064
  it('rechazar: un aviso de no aceptada, aunque se toque dos veces', async () => {
    const { publisher, applicant, id } = await scene()
    await reject(publisher, id, 'housing')
    await reject(publisher, id, 'housing')
    expect(await noticesOf([id])).toEqual([
      { kind: 'rejected', application_id: id, recipient_id: applicant.id },
    ])
  })

  // Covers: US2-AS5, FR-061, FR-064
  it('dejar sin efecto: el mismo aviso de no aceptada, uno solo', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)
    await revoke(publisher, id, 'not_concluded')
    await revoke(publisher, id, 'not_concluded')
    expect(await noticesOf([id])).toEqual([
      { kind: 'rejected', application_id: id, recipient_id: applicant.id },
    ])
  })

  // Covers: US2-AS7 (retirada mientras elegía el motivo: ningún correo)
  it('una retirada no avisa', async () => {
    const { publisher, applicant, id } = await scene()
    await withdraw(applicant, id)
    await reject(publisher, id, 'housing')
    expect(await noticesOf([id])).toEqual([])
  })
})

describeDb('vaciar la bandeja de salida (R3)', () => {
  // Covers: FR-064, SC-005 (cada aviso sale una vez, con el nombre del animal)
  it('devuelve cada aviso con el animal y lo borra: el segundo vaciado no lo repite', async () => {
    const { publisher, applicant, id } = await scene()
    await accept(publisher, id)

    const first = await db().rpc('claim_application_notices', { p_limit: 1000 })
    expect(first.error).toBeNull()
    expect(first.data?.filter((row) => row.application_id === id)).toEqual([
      expect.objectContaining({
        kind: 'accepted',
        recipient_id: applicant.id,
        pet_name: 'Tobi',
        pet_sex: expect.any(String),
      }),
    ])
    const second = await db().rpc('claim_application_notices', { p_limit: 1000 })
    expect(second.data?.filter((row) => row.application_id === id)).toEqual([])
    expect(await noticesOf([id])).toEqual([])
  })

  // Covers: FR-082 (borrar la cuenta de quien solicitó se lleva sus avisos)
  it('borrar a quien solicitó borra sus avisos', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1, 'Se va')
    const id = await insertApplication(applicant, pet, publisher)
    await accept(publisher, id)
    expect(await kindsOf([id])).toEqual(['accepted'])
    await applicant.cleanup()
    expect(await noticesOf([id])).toEqual([])
  })
})

describeDb('preguntar y contestar avisan a la otra punta', () => {
  // Covers: US3-AS1, FR-060, FR-061, FR-064
  it('preguntar avisa a quien solicitó y contestar al publicador, uno por toque', async () => {
    const { publisher, applicant, id } = await scene()
    const attempt = crypto.randomUUID()
    await ask(publisher, id, '¿El balcón tiene red?', attempt)
    await ask(publisher, id, '¿El balcón tiene red?', attempt)
    expect(await noticesOf([id])).toEqual([
      { kind: 'question_asked', application_id: id, recipient_id: applicant.id },
    ])

    const { data } = await db().from('application_questions').select('id').eq('application_id', id)
    const question = data?.[0]?.id ?? ''
    await answer(applicant, question, 'Sí, en todo el balcón.')
    await answer(applicant, question, 'Sí, en todo el balcón.')
    expect(await noticesOf([id])).toEqual([
      { kind: 'question_asked', application_id: id, recipient_id: applicant.id },
      { kind: 'question_answered', application_id: id, recipient_id: publisher.id },
    ])
  })

  // Covers: FR-044, FR-062 (lo que no se guardó no avisa)
  it('una pregunta que no entra, o una respuesta a una retirada, no avisan', async () => {
    const { publisher, applicant, id } = await scene()
    await ask(publisher, id, '   ')
    expect(await noticesOf([id])).toEqual([])
    await ask(publisher, id, '¿Y?')
    const { data } = await db().from('application_questions').select('id').eq('application_id', id)
    await withdraw(applicant, id)
    await answer(applicant, data?.[0]?.id ?? '', 'Sí')
    expect(await kindsOf([id])).toEqual(['question_asked'])
  })
})
