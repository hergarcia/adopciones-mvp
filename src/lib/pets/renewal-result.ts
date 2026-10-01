import type { Sex } from './options'
import type { PetState } from './types'

/** Lo que devuelve la base al tocar «Sigue disponible» (research R5). */
export const RENEWAL_OUTCOMES = [
  'renewed',
  'republished',
  'paused',
  'adopted',
  'taken_down',
  'needs_verification',
  'invalid',
] as const
export type RenewalOutcome = (typeof RENEWAL_OUTCOMES)[number]

/** Lo que la ruta del enlace le pasa a la pantalla: lo de la base, o que no se renovó. */
export type RenewalAsked = RenewalOutcome | 'preview' | 'error'

/** El animal del enlace como está ahora; null si el enlace no sirve. */
export type RenewalPet = { name: string; sex: Sex; state: PetState; expiresAt: Date | null }

export type RenewalAction = 'my_pets' | 'verify' | 'retry' | 'renew'

type RenewalScreen = RenewalOutcome | 'error' | 'confirm'

export type RenewalResultView = {
  /** Claves bajo `pets.renewal`. */
  title: `${RenewalScreen}.title` | 'error.title_unnamed'
  body: `${RenewalScreen}.body`
  values: { name?: string; sex?: Sex; date?: Date }
  action: RenewalAction
}

function isRunning(state: PetState): boolean {
  return state === 'available' || state === 'in_process'
}

// La pantalla después de tocar «Sigue disponible» (spec §Pantallas, FR-018, FR-020). Lo que dice
// lo decide el animal como está ahora, y la ruta solo aporta lo que la base no guarda: que se
// renovó recién, que faltaba el teléfono, o que no se pudo. Recargarla días después, o abrirla con
// otra `r` a mano, nunca dice algo que no es cierto. Del animal, solo nombre, estado y fecha.
export function renewalResult(
  asked: string | undefined,
  pet: RenewalPet | null,
): RenewalResultView {
  if (asked === 'error') {
    return pet === null
      ? { title: 'error.title_unnamed', body: 'error.body', values: {}, action: 'retry' }
      : {
          title: 'error.title',
          body: 'error.body',
          values: { name: pet.name, sex: pet.sex },
          action: 'retry',
        }
  }
  if (pet === null)
    return { title: 'invalid.title', body: 'invalid.body', values: {}, action: 'my_pets' }

  const named = { name: pet.name, sex: pet.sex }
  const { state, expiresAt } = pet
  if (state === 'paused' || state === 'adopted' || state === 'taken_down') {
    return { title: `${state}.title`, body: `${state}.body`, values: named, action: 'my_pets' }
  }
  if (asked === 'needs_verification') {
    return {
      title: 'needs_verification.title',
      body: 'needs_verification.body',
      values: named,
      action: 'verify',
    }
  }
  if ((asked === 'renewed' || asked === 'republished') && isRunning(state) && expiresAt !== null) {
    return {
      title: `${asked}.title`,
      body: `${asked}.body`,
      values: { ...named, date: expiresAt },
      action: 'my_pets',
    }
  }
  // Una vista previa, o un resultado que ya no coincide con el animal: se ofrece renovar.
  return { title: 'confirm.title', body: 'confirm.body', values: named, action: 'renew' }
}
