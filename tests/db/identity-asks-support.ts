// Lo que comparten las pruebas del pedido de identidad en la base (historia #257): una rescatista
// con un animal y una camada, solicitantes en cada estado de su identidad, y la tabla y los avisos
// leídos con el servicio. Las solicitudes se escriben directo con el servicio, como en la #65.
import { expect } from 'vitest'
import { responsePeople } from './application-responses-support'
import { insertApplication, petOf, type Person } from './applications-support'
import { openRequest } from './identity-support'
import { applyForYoung, litterWithYoung } from './litter-support'
import type { ListedPet } from './listing-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'
import { verifyIdentity } from './vouch-support'

type Client = SyntheticUser['client']

export type IdentityAsked = Functions['ask_identity']['Returns'][number]
export type MyApplicationRow = Functions['my_application']['Returns'][number]

export function askPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = responsePeople(cleanups)
  return {
    ...people,
    /** Una rescatista con nivel 1, su animal, y una solicitud de alguien con nivel 1. */
    asking: async () => people.scene(),
    /** La identidad aprobada sin teléfono: no tiene chapita, pero ya tiene la identidad (R3). */
    verifiedWithoutPhone: async (name = 'Sin teléfono') => {
      const subject = await people.person(0, name)
      await verifyIdentity(subject.id)
      return subject
    },
    /** Con un pedido de verificación en revisión. */
    inReview: async (name = 'En revisión') => {
      const subject = await people.person(1, name)
      await openRequest(subject.id)
      return subject
    },
    /** Una rescatista con una camada y una solicitud por su primera cría. */
    youngScene: async () => {
      const publisher = await people.person(1, 'Quien publica la camada')
      const litter = await litterWithYoung(publisher.id, 2)
      const young = litter.young[0]
      if (young === undefined) throw new Error('la camada no trajo crías')
      const applicant = await people.person(1, 'Quien solicita una cría')
      const id = await applyForYoung(applicant, young, publisher)
      return { publisher, applicant, young, litter, id }
    },
  }
}

/** Otra solicitud de la misma persona, a un animal nuevo de quien se pida. */
export async function applyToNewPet(
  applicant: Person,
  publisher: Person,
): Promise<{ pet: ListedPet; id: string }> {
  const pet = await petOf(publisher, { name: 'Luna' })
  return { pet, id: await insertApplication(applicant, pet, publisher) }
}

/** Pedir como lo hace la aplicación: con el servicio y el id de quien publicó. */
export async function askIdentity(publisher: { id: string }, id: string): Promise<IdentityAsked> {
  const { data, error } = await db().rpc('ask_identity', { p_publisher: publisher.id, p_id: id })
  expect(error).toBeNull()
  return firstRow(data, 'ask_identity')
}

/** El pedido como lo guardó la base, o null. */
export async function askRowOf(id: string) {
  const { data, error } = await db()
    .from('application_identity_asks')
    .select('application_id, asked_at, resolved_at')
    .eq('application_id', id)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}

/** Un pedido escrito directo con el servicio, sin pasar por `ask_identity`. */
export async function insertAsk(id: string, resolvedAt: string | null = null) {
  const { error } = await db()
    .from('application_identity_asks')
    .insert({ application_id: id, resolved_at: resolvedAt })
  expect(error).toBeNull()
}

/** Los avisos del pedido y de la aprobación de unas solicitudes, sin vaciar la bandeja. */
export async function identityNoticesOf(applicationIds: string[]) {
  const { data, error } = await db()
    .from('application_notices')
    .select('kind, application_id, recipient_id')
    .in('application_id', applicationIds)
    .in('kind', ['identity_asked', 'identity_verified'])
    .order('created_at')
  expect(error).toBeNull()
  return data ?? []
}

/** Lo que una sesión lee de la tabla, directo con su token. */
export async function asksTableAs(client: Client) {
  const { data, error } = await client.from('application_identity_asks').select('*')
  return { rows: data ?? [], error }
}

export async function myApplicationAs(client: Client, id: string) {
  const { data, error } = await client.rpc('my_application', { p_id: id })
  const rows: MyApplicationRow[] = data ?? []
  return { rows, error }
}

/** La fila de las respuestas de una solicitud, leída con el servicio. */
export async function reviewOf(id: string) {
  const { data, error } = await db()
    .from('application_reviews')
    .select('opened_at, first_response_at')
    .eq('application_id', id)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}
