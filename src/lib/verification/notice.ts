import { formatPhoneNumber } from './phone-number'
import type { PhoneStatus } from './phone-status'

export type ScreenNotice =
  | { message: 'profile_saved' | 'profile_changes_saved' | 'phone_verified'; variant: 'success' }
  | { message: 'cancelled_change'; variant: 'success'; number: string }
  | { message: 'cancelled_first'; variant: 'success' }
  | { message: 'cancel_failed'; variant: 'error' }

// El aviso de «Mi perfil» y de «Verificar teléfono» según la marca que dejó la acción anterior.
// Después de cancelar se dice lo que quedó, leído del estado y no de la URL: en un cambio, el
// número que sigue verificado; en una primera verificación no queda ninguno que nombrar (FR-015a).
export function screenNotice(
  flags: { guardado?: string; error?: string },
  status: PhoneStatus,
): ScreenNotice | null {
  if (flags.error === 'cancelar') return { message: 'cancel_failed', variant: 'error' }

  switch (flags.guardado) {
    case 'perfil':
      return { message: 'profile_saved', variant: 'success' }
    case 'cambios':
      return { message: 'profile_changes_saved', variant: 'success' }
    case 'telefono':
      return { message: 'phone_verified', variant: 'success' }
    case 'cancelado':
      return status.kind === 'verified'
        ? {
            message: 'cancelled_change',
            variant: 'success',
            number: formatPhoneNumber(status.number),
          }
        : { message: 'cancelled_first', variant: 'success' }
    default:
      return null
  }
}
