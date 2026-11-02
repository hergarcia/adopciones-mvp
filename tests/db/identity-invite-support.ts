// Lo que comparten las pruebas de la invitación a verificar la identidad en la base (historia #281):
// las personas, la marca de «Ahora no» leída con el servicio y tocada con la sesión, y el pedido de
// verificación con un origen elegido.
import { expect } from 'vitest'
import { IDENTITY_DB_RULES } from '../../src/lib/verification/rules'
import { FRONT, SELFIE, people } from './identity-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export function invitePeople(cleanups: SyntheticUser['cleanup'][]) {
  const person = people(cleanups)
  return {
    /** Teléfono verificado y sin la identidad: la que ve la invitación. */
    owner: () => person(),
    /** Otra persona con su propia cuenta. */
    other: () => person(),
    admin: () => person({ admin: true }),
  }
}

/** La fila de «Ahora no» de una persona, leída con el servicio; nula si no tocó. */
export async function dismissalOf(personId: string) {
  const { data, error } = await db()
    .from('identity_invite_dismissals')
    .select('person_id, dismissed_on')
    .eq('person_id', personId)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}

export async function dismissAs(client: Client) {
  const { data, error } = await client.rpc('dismiss_identity_invite')
  return { outcome: data, error }
}

export async function dismissedAs(client: Client) {
  const { data, error } = await client.rpc('identity_invite_dismissed')
  return { dismissed: data, error }
}

/** «Ahora no» tocado por la persona: falla si la base no lo guardó. */
export async function dismissed(client: Client) {
  const { outcome, error } = await dismissAs(client)
  expect(error).toBeNull()
  expect(outcome).toBe('dismissed')
}

export async function submitFrom(userId: string, origin: string) {
  return db().rpc('submit_identity_request', {
    p_user_id: userId,
    p_origin: origin,
    p_front: FRONT,
    p_selfie: SELFIE,
    ...IDENTITY_DB_RULES,
  })
}
