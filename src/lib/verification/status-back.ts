import type { IdentityOrigin } from './identity'
import type { IdentityStatus } from './identity-status'

export type StatusBack = 'profile' | 'my_pets'

// Adónde vuelve la pantalla del pedido (historia #283): a «Mis animales» solo mientras está en
// revisión un pedido que empezó en su invitación. Aprobado, el correo ya lleva ahí; en los demás
// estados y desde «Mi perfil», al perfil, como siempre.
export function statusBack(
  kind: Exclude<IdentityStatus['kind'], 'none'>,
  origin: IdentityOrigin | null,
): StatusBack {
  return kind === 'in_review' && origin === 'my_pets' ? 'my_pets' : 'profile'
}
