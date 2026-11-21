// La pregunta propia en la carpeta de solicitudes de un animal (historia #298): quien publicó lee la
// pregunta de hoy y, de las que esperan respuesta, lo que contestaron; de una aceptada o cerrada, la
// carpeta no trae la respuesta (docs/03 §4, Ley 18.331), y otra persona no recibe nada.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { markAccepted, petApplicationsAs, setStatus } from './application-responses-support'
import {
  KIRA_ANSWER,
  KIRA_QUESTION,
  LITTER_QUESTION,
  ownQuestionPeople,
  submitOwn,
} from './own-questions-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, rescuer, applicants } = ownQuestionPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']

async function inboxPetAs(client: Client, petId: string) {
  const { data, error } = await client.rpc('inbox_pet', { p_pet: petId })
  expect(error).toBeNull()
  return data ?? []
}

async function ownOf(client: Client, petId: string, id: string) {
  const { rows, error } = await petApplicationsAs(client, petId)
  expect(error).toBeNull()
  const row = rows.find((item) => item.id === id)
  return { own_question: row?.own_question, own_answer: row?.own_answer }
}

describeDb('la carpeta de un animal con pregunta propia', () => {
  // Covers: #298 (la pregunta de hoy arriba: la del animal, la de la camada en una cría, ninguna)
  it('el encabezado trae la pregunta de hoy solo a quien publicó', async () => {
    const { publisher, pipo, kira, litter } = await rescuer()
    const other = await person(1, 'Sin relación')
    const young = litter.young[0]?.id ?? ''
    expect((await inboxPetAs(publisher.client, kira.petId))[0]?.own_question).toBe(KIRA_QUESTION)
    expect((await inboxPetAs(publisher.client, young))[0]?.own_question).toBe(LITTER_QUESTION)
    expect((await inboxPetAs(publisher.client, pipo.petId))[0]?.own_question).toBeNull()
    expect(await inboxPetAs(other.client, kira.petId)).toEqual([])
  })

  // Covers: #298 (la respuesta solo en las que esperan respuesta; la de otra persona, nunca)
  it('trae la respuesta mientras espera y deja de traerla al aceptarla o cerrarla', async () => {
    const { publisher, kira } = await rescuer()
    const { lucia, bruno } = await applicants()
    const other = await person(1, 'Sin relación')
    const own = { ownQuestion: KIRA_QUESTION, ownAnswer: KIRA_ANSWER }
    const accepted = (await submitOwn(lucia, kira.code, own)).application_id ?? ''
    const withdrawn = (await submitOwn(bruno, kira.code, own)).application_id ?? ''
    const answered = { own_question: KIRA_QUESTION, own_answer: KIRA_ANSWER }
    const hidden = { own_question: null, own_answer: null }

    expect(await ownOf(publisher.client, kira.petId, accepted)).toEqual(answered)
    expect(await ownOf(publisher.client, kira.petId, withdrawn)).toEqual(answered)
    expect((await petApplicationsAs(other.client, kira.petId)).rows).toEqual([])

    await markAccepted(accepted)
    await setStatus(withdrawn, 'withdrawn')
    expect(await ownOf(publisher.client, kira.petId, accepted)).toEqual(hidden)
    expect(await ownOf(publisher.client, kira.petId, withdrawn)).toEqual(hidden)
  })
})
