import type { AdoptionRow } from './types'

export type AdoptionState = 'pending' | 'accepted' | 'declined' | 'ended'

export type AdoptionView = {
  state: AdoptionState
  /** Un bloqueo o una suspensión cortaron el contacto, para siempre (FR-032). */
  cut: boolean
  /** «Acepto el compromiso»: solo quien adoptó, pendiente, en curso, sin corte ni suspensión. */
  canAccept: boolean
  /** «Yo no adopté»: en las mismas condiciones que aceptar (FR-020). */
  canDecline: boolean
  /** El teléfono a la vista, «El contacto ya no está disponible», o nada (FR-030, FR-033). */
  contact: 'shown' | 'unavailable' | 'none'
  /** Después de «Yo no adopté», el compromiso ya no se muestra (FR-021). */
  showsCommitment: boolean
}

function stateOf(row: AdoptionRow): AdoptionState {
  if (row.declinedAt !== null) return 'declined'
  if (row.endedAt !== null) return 'ended'
  return row.adopterAcceptedAt === null ? 'pending' : 'accepted'
}

// Lo que ve cada lado de una adopción (research R9), desde la fila de `adoption_of`. El contacto
// cortado se dice igual sea cual sea el motivo (FR-033); una adopción que terminó o se deshizo ya no
// lo muestra, sin aviso (FR-031, FR-021).
export function adoptionView(row: AdoptionRow): AdoptionView {
  const state = stateOf(row)
  const ongoing = state === 'pending' || state === 'accepted'
  const canAct =
    row.side === 'adopter' && state === 'pending' && !row.contactCut && !row.adopterSuspended
  return {
    state,
    cut: row.contactCut,
    canAccept: canAct,
    canDecline: canAct,
    contact: !ongoing ? 'none' : row.contactCut ? 'unavailable' : 'shown',
    showsCommitment: state !== 'declined',
  }
}
