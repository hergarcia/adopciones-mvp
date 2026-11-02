// Lo que comparten las pruebas de las solicitudes que esperan la identidad (historia #289): una
// rescatista con un animal y una camada que piden identidad y un animal que pide solo el teléfono,
// solicitantes en cada estado de su identidad, y las dos tablas, las solicitudes y los avisos leídos
// con el servicio.
import { expect } from 'vitest'
import type { Json } from '../../src/lib/supabase/types'
import { ANSWERS, PENDING_TTL, applicationPeople, petOf, type Person } from './applications-support'
import { addRejections, openRequest } from './identity-support'
import { litterWithYoung } from './litter-support'
import type { ListedPet } from './listing-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'
import { verifyIdentity } from './vouch-support'

type Client = SyntheticUser['client']
export type Held = Functions['hold_application']['Returns'][number]
export type MyHeldRow = Functions['my_held_applications']['Returns'][number]
export type WithdrawnHeld = Functions['withdraw_held_application']['Returns'][number]

export type Young = { id: string; name: string; code: string }

export function heldPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = applicationPeople(cleanups)
  return {
    ...people,
    /** Una rescatista con Tobi, que pide identidad, una camada que también la pide y Pipo, que no. */
    rescuer: async () => {
      const publisher = await people.person(1, 'Carla')
      const tobi = await petOf(publisher, { requiredLevel: 2 })
      const pipo = await petOf(publisher, { name: 'Pipo' })
      const litter = await litterWithYoung(publisher.id, 2)
      const young = litter.young[0]
      if (young === undefined) throw new Error('la camada no trajo crías')
      await askIdentityFor(young.id)
      return { publisher, tobi, pipo, litter, young }
    },
    /** Con el teléfono y el pedido de identidad en revisión; devuelve también el id del pedido. */
    inReview: async (name = 'Bruno') => {
      const subject = await people.person(1, name)
      const requestId = await openRequest(subject.id)
      return { subject, requestId }
    },
    /** Con el teléfono y sin ningún pedido de identidad. */
    noRequest: async (name = 'Sin pedido') => people.person(1, name),
    /** Con dos rechazos en los últimos 30 días y un pedido en revisión: el próximo llega al tope. */
    nearCap: async (name = 'Casi al tope') => {
      const subject = await people.person(1, name)
      await addRejections(subject.id, 3, 10)
      const requestId = await openRequest(subject.id)
      return { subject, requestId }
    },
    /** La identidad aprobada y sin teléfono. */
    verifiedWithoutPhone: async (name = 'Sin teléfono') => {
      const subject = await people.person(0, name)
      await verifyIdentity(subject.id)
      return subject
    },
  }
}

/** Que una cría pida identidad, como la camada que la pide. */
export async function askIdentityFor(petId: string) {
  const { error } = await db().from('pets').update({ required_level: 2 }).eq('id', petId)
  expect(error).toBeNull()
}

/** Dejarla escrita como lo hace la aplicación: con el servicio y el id de quien solicita. */
export async function hold(
  applicant: { id: string },
  code: string,
  options: { attempt?: string; answers?: Json } = {},
): Promise<Held> {
  const { data, error } = await db().rpc('hold_application', {
    p_applicant: applicant.id,
    p_attempt: options.attempt ?? crypto.randomUUID(),
    p_code: code,
    p_answers: options.answers ?? ANSWERS,
    p_pending_ttl: PENDING_TTL,
  })
  expect(error).toBeNull()
  return firstRow(data, 'hold_application')
}

/** Retirar una que espera como lo hace la aplicación. */
export async function withdrawHeld(applicant: { id: string }, id: string): Promise<WithdrawnHeld> {
  const { data, error } = await db().rpc('withdraw_held_application', {
    p_user: applicant.id,
    p_id: id,
  })
  expect(error).toBeNull()
  return firstRow(data, 'withdraw_held_application')
}

/** Las filas que esperan o no salieron de una persona, leídas con el servicio. */
export async function heldOf(applicantId: string) {
  const { data, error } = await db()
    .from('held_applications')
    .select('*')
    .eq('applicant_id', applicantId)
    .order('written_at')
  expect(error).toBeNull()
  return data ?? []
}

/** Una que espera escrita directo con el servicio, sin pasar por `hold_application`. */
export async function insertHeld(applicant: Person, pet: ListedPet | Young, publisher: Person) {
  const petId = 'petId' in pet ? pet.petId : pet.id
  const { data, error } = await db()
    .from('held_applications')
    .insert({
      applicant_id: applicant.id,
      pet_id: petId,
      publisher_id: publisher.id,
      attempt_id: crypto.randomUUID(),
      answers: ANSWERS,
      pet_name: 'Tobi',
      expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    })
    .select('id')
    .single()
  expect(error).toBeNull()
  return data?.id ?? ''
}

/** Los avisos de correo de unas solicitudes, sin vaciar la bandeja. */
export async function noticesFor(applicationIds: string[]) {
  const { data, error } = await db()
    .from('application_notices')
    .select('kind, application_id, recipient_id')
    .in('application_id', applicationIds)
  expect(error).toBeNull()
  return data ?? []
}

export async function myHeldAs(client: Client) {
  const { data, error } = await client.rpc('my_held_applications')
  const rows: MyHeldRow[] = data ?? []
  return { rows, error }
}

export async function myHeldOneAs(client: Client, id: string) {
  const { data, error } = await client.rpc('my_held_application', { p_id: id })
  return { rows: data ?? [], error }
}

/** Lo que una sesión lee de una tabla, directo con su token. */
export async function heldTableAs(
  client: Client,
  table: 'held_applications' | 'held_application_moments',
) {
  const { data, error } = await client.from(table).select('*')
  return { rows: data ?? [], error }
}
