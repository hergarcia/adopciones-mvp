import { VOUCH_ORIGINS, type VouchOrigin } from './types'

// Llega de una acción del servidor, que cualquiera puede llamar con lo que quiera: lo que no es un
// origen conocido cuenta como el perfil, el camino de siempre.
export function vouchOrigin(value: unknown): VouchOrigin {
  return VOUCH_ORIGINS.find((origin) => origin === value) ?? 'profile'
}
