import type { PublicLitter, PublicLitterResult } from './types'

export type LitterPageState =
  | { kind: 'missing' }
  | { kind: 'unavailable'; offerSignIn: boolean }
  | { kind: 'blocked'; publisherPublicId: string }
  | { kind: 'own_hidden'; litter: PublicLitter; reason: 'no_level' | 'taken_down' }
  | { kind: 'own_listed'; litter: PublicLitter }
  | { kind: 'listed'; litter: PublicLitter }

// Qué pantalla ve cada uno, con la precedencia de la ficha de un animal (`petPageState`): el bloqueo
// llega decidido por la base, y la suspendida y la dada de baja llegan como «no existe». «Entrar»
// solo sin sesión: con sesión, quien mira no es quien la publicó.
export function litterPageState(
  result: PublicLitterResult | null,
  session: { signedIn: boolean },
): LitterPageState {
  if (result === null) return { kind: 'missing' }
  if (!('code' in result)) {
    return result.visibility === 'blocked'
      ? { kind: 'blocked', publisherPublicId: result.publisherPublicId }
      : { kind: 'unavailable', offerSignIn: !session.signedIn }
  }
  if (!result.isOwner) return { kind: 'listed', litter: result }
  if (result.visibility === 'listed') return { kind: 'own_listed', litter: result }
  return {
    kind: 'own_hidden',
    litter: result,
    reason: result.takedown === null ? 'no_level' : 'taken_down',
  }
}
