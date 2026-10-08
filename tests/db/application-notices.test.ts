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
import { acceptCommitment, declineAdoption, markAdopted } from './adoptions-support'
import { setState } from './lifecycle-support'
import { block, suspend } from './moderation-support'
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

describeDb('los cierres del animal avisan; los de las personas, no (US4)', () => {
  // Covers: US4-AS1, FR-061 (la aceptada y la que esperaba, un aviso cada una)
  it('adoptar avisa «encontró hogar» a la aceptada y a la que esperaba respuesta', async () => {
    const { publisher, pet, applicant, id } = await scene()
    const waiting = await person(1, 'Esperaba')
    const waitingId = await insertApplication(waiting, pet, publisher)
    await markAccepted(id)
    await setState(pet.petId, 'adopted')
    expect(await noticesOf([id, waitingId])).toEqual(
      expect.arrayContaining([
        { kind: 'closed_adopted', application_id: id, recipient_id: applicant.id },
        { kind: 'closed_adopted', application_id: waitingId, recipient_id: waiting.id },
      ]),
    )
    expect(await kindsOf([id, waitingId])).toHaveLength(2)
  })

  // Covers: US4-AS2, FR-061, edge «el publicador borra su cuenta»
  it('borrar el animal, darlo de baja o borrar la cuenta del publicador avisan «ya no está publicado»', async () => {
    const deleted = await scene()
    const removed = await db().from('pets').delete().eq('id', deleted.pet.petId)
    expect(removed.error).toBeNull()
    const takenDown = await scene()
    await setState(takenDown.pet.petId, 'taken_down')
    const gone = await scene()
    await markAccepted(gone.id)
    await gone.publisher.cleanup()

    for (const { applicant, id } of [deleted, takenDown, gone]) {
      // oxlint-disable-next-line no-await-in-loop -- tres caminos, de a uno
      expect(await noticesOf([id])).toEqual([
        { kind: 'closed_unpublished', application_id: id, recipient_id: applicant.id },
      ])
    }
  })

  // Covers: US4-AS3, US4-AS4, FR-062 (retirar, bloquear y suspender no avisan a nadie)
  it('retirar, bloquear de cualquiera de los dos lados y suspender a cualquiera no escriben', async () => {
    const scenes = await Promise.all(Array.from({ length: 5 }, () => scene()))
    const [withdrawn, byApplicant, byPublisher, applicantSuspended, publisherSuspended] = scenes
    if (!withdrawn || !byApplicant || !byPublisher || !applicantSuspended || !publisherSuspended) {
      throw new Error('faltan escenas')
    }
    await markAccepted(byApplicant.id)
    await withdraw(withdrawn.applicant, withdrawn.id)
    await block(byApplicant.applicant.id, byApplicant.publisher.id)
    await block(byPublisher.publisher.id, byPublisher.applicant.id)
    await suspend(applicantSuspended.applicant.id)
    await suspend(publisherSuspended.publisher.id)

    const ids = scenes.map(({ id }) => id)
    const { data } = await db().from('applications').select('status').in('id', ids)
    expect(data?.map((row) => row.status).toSorted()).toEqual([
      'closed',
      'closed',
      'closed',
      'closed',
      'withdrawn',
    ])
    expect(await noticesOf(ids)).toEqual([])
  })
})

describeDb('marcar adoptado eligiendo a quién (historia #67, FR-050)', () => {
  // Covers: US1-AS3, US1-AS4, FR-050 (la elegida recibe el suyo en lugar del de encontró hogar)
  it('a una persona: «Adoptaste» para ella y «encontró hogar» para las demás', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await markAccepted(id)
    const other = await person(1, 'Otra aceptada')
    const otherId = await insertApplication(other, pet, publisher)
    await markAccepted(otherId)
    const waiting = await person(1, 'Esperaba')
    const waitingId = await insertApplication(waiting, pet, publisher)

    await markAdopted(publisher, pet.petId, id)

    const notices = await noticesOf([id, otherId, waitingId])
    expect(notices).toHaveLength(3)
    expect(notices).toEqual(
      expect.arrayContaining([
        { kind: 'adoption_marked', application_id: id, recipient_id: applicant.id },
        { kind: 'closed_adopted', application_id: otherId, recipient_id: other.id },
        { kind: 'closed_adopted', application_id: waitingId, recipient_id: waiting.id },
      ]),
    )
  })

  // Covers: US1-AS5, FR-050
  it('por fuera del sitio: solo «encontró hogar», a cada una', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await markAccepted(id)
    await markAdopted(publisher, pet.petId, null)
    expect(await noticesOf([id])).toEqual([
      { kind: 'closed_adopted', application_id: id, recipient_id: applicant.id },
    ])
  })
})

describeDb('aceptar el compromiso (historia #67, FR-051, FR-055)', () => {
  // Covers: US2-AS2, US2-AS6, FR-051, FR-055 (uno por persona, una sola vez con doble toque)
  it('aceptar escribe un «compromiso» para cada una, y el segundo toque nada', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await markAccepted(id)
    await markAdopted(publisher, pet.petId, id)
    await db().from('application_notices').delete().eq('application_id', id)

    await acceptCommitment(applicant, id)
    await acceptCommitment(applicant, id)

    const notices = await noticesOf([id])
    expect(notices).toHaveLength(2)
    expect(notices).toEqual(
      expect.arrayContaining([
        { kind: 'commitment_accepted', application_id: id, recipient_id: applicant.id },
        { kind: 'commitment_accepted', application_id: id, recipient_id: publisher.id },
      ]),
    )
  })

  // Covers: US2-AS5, FR-012 (sin aceptar, ningún otro correo)
  it('sin aceptar no se escribe ningún otro correo', async () => {
    const { publisher, pet, id } = await scene()
    await markAccepted(id)
    await markAdopted(publisher, pet.petId, id)
    expect(await kindsOf([id])).toEqual(['adoption_marked'])
  })
})

describeDb('«Yo no adopté» (historia #67, FR-052, FR-055)', () => {
  // Covers: US3-AS3, US3-AS5, FR-052 (un correo a quien lo dio, una sola vez con doble toque)
  it('escribe un aviso para quien lo dio, y el segundo toque nada', async () => {
    const { publisher, pet, applicant, id } = await scene()
    await markAccepted(id)
    await markAdopted(publisher, pet.petId, id)
    await db().from('application_notices').delete().eq('application_id', id)

    await declineAdoption(applicant, id)
    await declineAdoption(applicant, id)

    expect(await noticesOf([id])).toEqual([
      { kind: 'adoption_declined', application_id: id, recipient_id: publisher.id },
    ])
  })
})
