import type { PublicPet, PublicPetResult } from './types'

/** Por qué nadie más ve la ficha que mira su publicador. */
export type OwnHiddenReason = 'no_level' | 'paused' | 'expired' | 'taken_down'

export type PetPageState =
  | { kind: 'missing' }
  | { kind: 'paused' }
  | { kind: 'expired' }
  | { kind: 'unavailable'; offerSignIn: boolean }
  | { kind: 'own_hidden'; pet: PublicPet; reason: OwnHiddenReason }
  | { kind: 'own_listed'; pet: PublicPet }
  | { kind: 'listed'; pet: PublicPet }

// Lo que el publicador eligió pesa más que su teléfono: una pausada sin nivel 1 se explica como
// pausada, que es lo que tiene que deshacer primero.
function hiddenReason(pet: PublicPet): OwnHiddenReason {
  if (pet.state === 'taken_down' || pet.state === 'paused' || pet.state === 'expired')
    return pet.state
  return 'no_level'
}

// Qué pantalla ve cada uno (research R10 de la #57, precedencia de la spec #59). Una falla de la
// base no llega acá: sube a `error.tsx`, que nunca dice «no está publicado» (FR-009). «Entrar» solo
// sin sesión y sin nivel 1: con sesión, quien mira no es el publicador; pausada y vencida ya dicen
// por qué, y entrar no le mostraría nada más a quien no lo publicó.
export function petPageState(
  result: PublicPetResult | null,
  session: { signedIn: boolean },
): PetPageState {
  if (result === null) return { kind: 'missing' }
  if (!('code' in result)) {
    if (result.visibility === 'paused') return { kind: 'paused' }
    if (result.visibility === 'expired') return { kind: 'expired' }
    return { kind: 'unavailable', offerSignIn: !session.signedIn }
  }
  if (!result.isOwner) return { kind: 'listed', pet: result }
  return result.visibility === 'listed' || result.visibility === 'adopted'
    ? { kind: 'own_listed', pet: result }
    : { kind: 'own_hidden', pet: result, reason: hiddenReason(result) }
}
