// Lo que comparten las pruebas de responder solicitudes en la base (historia #65): una publicadora
// con un animal, solicitantes con nivel 1, una solicitud escrita con el servicio en el estado pedido,
// y las lecturas como cada sesión. Las funciones de una user story no se usan para preparar otra.
import { expect } from 'vitest'
import type { Database } from '../../src/lib/supabase/types'
import {
  applicationPeople,
  insertApplication,
  type PetOptions,
  type Person,
} from './applications-support'
import type { ListedPet } from './listing-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']
type Status = Database['public']['Tables']['applications']['Row']['status']

export type Accepted = Functions['accept_application']['Returns'][number]
export type Rejected = Functions['reject_application']['Returns'][number]
export type Revoked = Functions['revoke_acceptance']['Returns'][number]
export type Opened = Functions['open_application']['Returns'][number]
export type ContactRow = Functions['application_contact']['Returns'][number]
export type PublisherRow = Functions['publisher_application']['Returns'][number]
export type PetApplicationRow = Functions['pet_applications']['Returns'][number]
export type InboxRow = Functions['publisher_inbox']['Returns'][number]
export type ClaimedNotice = Functions['claim_application_notices']['Returns'][number]

export type Scene = {
  publisher: Person
  pet: ListedPet
  applicant: Person
  id: string
}

export function responsePeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = applicationPeople(cleanups)
  return {
    ...people,
    /** Una publicadora con nivel 1, su animal y una solicitud de alguien con nivel 1. */
    scene: async (
      status: Status = 'sent',
      options: PetOptions & { closeReason?: string } = {},
    ): Promise<Scene> => {
      const { publisher, pet } = await people.publisherWithPet(options)
      const applicant = await people.person(1, 'Quien solicita')
      const id = await insertApplication(applicant, pet, publisher, {
        status,
        close_reason: options.closeReason ?? null,
      })
      return { publisher, pet, applicant, id }
    },
  }
}

/** La aceptada como la deja `accept_application`: el estado y la fila de las respuestas. */
export async function markAccepted(id: string) {
  const status = await db().from('applications').update({ status: 'accepted' }).eq('id', id)
  expect(status.error).toBeNull()
  const review = await db()
    .from('application_reviews')
    .upsert({ application_id: id, accepted_at: new Date().toISOString() })
  expect(review.error).toBeNull()
}

export async function setStatus(id: string, status: Status, closeReason: string | null = null) {
  const { error } = await db()
    .from('applications')
    .update({ status, close_reason: closeReason })
    .eq('id', id)
  expect(error).toBeNull()
}

export async function accept(publisher: { id: string }, id: string): Promise<Accepted> {
  const { data, error } = await db().rpc('accept_application', {
    p_publisher: publisher.id,
    p_id: id,
  })
  expect(error).toBeNull()
  return firstRow(data, 'accept_application')
}

export async function reject(
  publisher: { id: string },
  id: string,
  reason: string,
  note: string | null = null,
): Promise<Rejected> {
  const { data, error } = await db().rpc('reject_application', {
    p_publisher: publisher.id,
    p_id: id,
    p_reason: reason,
    ...(note === null ? {} : { p_note: note }),
  })
  expect(error).toBeNull()
  return firstRow(data, 'reject_application')
}

export async function revoke(
  publisher: { id: string },
  id: string,
  reason: string,
  note: string | null = null,
): Promise<Revoked> {
  const { data, error } = await db().rpc('revoke_acceptance', {
    p_publisher: publisher.id,
    p_id: id,
    p_reason: reason,
    ...(note === null ? {} : { p_note: note }),
  })
  expect(error).toBeNull()
  return firstRow(data, 'revoke_acceptance')
}

export async function open(publisher: { id: string }, id: string): Promise<Opened[]> {
  const { data, error } = await db().rpc('open_application', {
    p_publisher: publisher.id,
    p_id: id,
  })
  expect(error).toBeNull()
  return data ?? []
}

export async function visit(publisher: { id: string }, petId?: string) {
  const { error } = await db().rpc('visit_inbox', {
    p_publisher: publisher.id,
    ...(petId === undefined ? {} : { p_pet: petId }),
  })
  expect(error).toBeNull()
}

/** Las de la bandeja de salida, sin vaciarla: el vaciado lo prueba su propio test. */
export async function noticesOf(applicationIds: string[]) {
  const { data, error } = await db()
    .from('application_notices')
    .select('kind, application_id, recipient_id')
    .in('application_id', applicationIds)
    .order('created_at')
  expect(error).toBeNull()
  return data ?? []
}

export async function contactAs(client: Client, id: string) {
  const { data, error } = await client.rpc('application_contact', { p_id: id })
  const rows: ContactRow[] = data ?? []
  return { rows, error }
}

export async function publisherViewAs(client: Client, id: string) {
  const { data, error } = await client.rpc('publisher_application', { p_id: id })
  const rows: PublisherRow[] = data ?? []
  return { rows, error }
}

export async function petApplicationsAs(client: Client, petId: string) {
  const { data, error } = await client.rpc('pet_applications', { p_pet: petId })
  const rows: PetApplicationRow[] = data ?? []
  return { rows, error }
}

export async function inboxAs(client: Client) {
  const { data, error } = await client.rpc('publisher_inbox')
  const rows: InboxRow[] = data ?? []
  return { rows, error }
}

export async function verifiedNumberOf(userId: string): Promise<string> {
  const { data } = await db()
    .from('phones')
    .select('verified_number')
    .eq('user_id', userId)
    .single()
  return data?.verified_number ?? ''
}

export type Asked = Functions['ask_question']['Returns'][number]
export type Answered = Functions['answer_question']['Returns'][number]
export type QuestionRow = Functions['application_questions_of']['Returns'][number]

export async function ask(
  publisher: { id: string },
  id: string,
  text: string,
  attempt: string = crypto.randomUUID(),
): Promise<Asked> {
  const { data, error } = await db().rpc('ask_question', {
    p_publisher: publisher.id,
    p_id: id,
    p_attempt: attempt,
    p_text: text,
  })
  expect(error).toBeNull()
  return firstRow(data, 'ask_question')
}

export async function answer(
  applicant: { id: string },
  questionId: string,
  text: string,
): Promise<Answered> {
  const { data, error } = await db().rpc('answer_question', {
    p_applicant: applicant.id,
    p_question: questionId,
    p_text: text,
  })
  expect(error).toBeNull()
  return firstRow(data, 'answer_question')
}

export async function questionsAs(client: Client, id: string) {
  const { data, error } = await client.rpc('application_questions_of', { p_id: id })
  const rows: QuestionRow[] = data ?? []
  return { rows, error }
}
