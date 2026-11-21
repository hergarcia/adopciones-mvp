import type { EventProps, ProfileLinkOrigin } from './events'
import type { MeasuredLevel } from './measured-levels'

// El enlace que la dueña copia o manda, con su nivel de ese momento (historia #280). Un nivel que no se
// pudo leer no sale: «nada» contaría como sin verificar a quien sí verificó (FR-018).
export function profileLinkProps(
  from: ProfileLinkOrigin,
  level: MeasuredLevel | null,
): EventProps['profile_link_copied'] {
  return level === null ? { from } : { from, owner_level: level }
}
