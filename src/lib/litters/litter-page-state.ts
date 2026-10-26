import type { PublicLitter, PublicLitterResult } from './types'

/** Por qué nadie más ve la camada que mira su dueña. */
export type OwnHiddenLitterReason = 'no_level' | 'paused' | 'expired' | 'taken_down'

export type LitterPageState =
  | { kind: 'missing' }
  | { kind: 'paused' }
  | { kind: 'expired' }
  | { kind: 'unavailable'; offerSignIn: boolean }
  | { kind: 'blocked'; publisherPublicId: string }
  | { kind: 'own_hidden'; litter: PublicLitter; reason: OwnHiddenLitterReason }
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
    if (result.visibility === 'blocked')
      return { kind: 'blocked', publisherPublicId: result.publisherPublicId }
    if (result.visibility === 'paused' || result.visibility === 'expired')
      return { kind: result.visibility }
    return { kind: 'unavailable', offerSignIn: !session.signedIn }
  }
  if (!result.isOwner) return { kind: 'listed', litter: result }
  if (result.visibility === 'listed') return { kind: 'own_listed', litter: result }
  // Lo que eligió quien publica pesa más que su teléfono, como en la ficha de un animal.
  const reason =
    result.takedown !== null
      ? 'taken_down'
      : result.visibility === 'paused' || result.visibility === 'expired'
        ? result.visibility
        : 'no_level'
  return { kind: 'own_hidden', litter: result, reason }
}
