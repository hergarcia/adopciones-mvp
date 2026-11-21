import { hashLinkToken, isLinkToken, newLinkToken } from '@/lib/links/link-token'

// El enlace «Sigue disponible» de un recordatorio (research R5 de #59), con el token de todos los
// enlaces por correo.
export const newRenewalToken = newLinkToken
export const hashRenewalToken = hashLinkToken
export const isRenewalToken = isLinkToken
