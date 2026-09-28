import type { PublicPet, PublicPetResult } from './types'

export type PetPageState =
  | { kind: 'missing' }
  | { kind: 'unavailable'; offerSignIn: boolean }
  | { kind: 'own_hidden'; pet: PublicPet }
  | { kind: 'own_listed'; pet: PublicPet }
  | { kind: 'listed'; pet: PublicPet }

// Qué pantalla ve cada uno (research R10). Una falla de la base no llega acá: sube a `error.tsx`,
// que nunca dice «no está publicado» (FR-009). «Entrar» solo sin sesión: con sesión y oculto, quien
// mira no es el publicador, y entrar con otra cuenta no le mostraría nada.
export function petPageState(
  result: PublicPetResult | null,
  session: { signedIn: boolean },
): PetPageState {
  if (result === null) return { kind: 'missing' }
  if (!('code' in result)) return { kind: 'unavailable', offerSignIn: !session.signedIn }
  if (!result.isOwner) return { kind: 'listed', pet: result }
  return result.visibility === 'listed'
    ? { kind: 'own_listed', pet: result }
    : { kind: 'own_hidden', pet: result }
}
