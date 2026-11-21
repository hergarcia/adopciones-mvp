/** El pedido de verificación de identidad (historia #11). */
export const IDENTITY_PATH = '/verificar-identidad'

/** La marca de quien llega desde la invitación de «Mis animales» (historia #281, R4). */
export const INVITE_FLAG = 'invitacion'

export function identityFromInvitePath(): string {
  return `${IDENTITY_PATH}?pedir=1&${INVITE_FLAG}=1`
}
