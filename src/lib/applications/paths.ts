export const MY_APPLICATIONS_PATH = '/mis-solicitudes'

/** La marca de quien vuelve de verificar desde «Quiero adoptar» (research R11). */
export const AFTER_FLAG = 'tras'
export const AFTER_PHONE = 'telefono'
/** La lleva el botón del correo de identidad aprobada: el pedido ya no existe para preguntarle. */
export const AFTER_IDENTITY = 'identidad'
/** El animal desde el que se pidió la identidad, para volver a él (research R10). */
export const RETURN_FLAG = 'animal'
/** La confirmación de Mis solicitudes después de retirar: lleva el id, para decir por quién. */
export const WITHDRAWN_FLAG = 'retirada'

export function applyPath(code: string): string {
  return `/solicitar/${code}`
}

export function applyAfterPhonePath(code: string): string {
  return `${applyPath(code)}?${AFTER_FLAG}=${AFTER_PHONE}`
}

export function applyAfterIdentityPath(code: string): string {
  return `${applyPath(code)}?${AFTER_FLAG}=${AFTER_IDENTITY}`
}

export function identityForPetPath(code: string): string {
  return `/verificar-identidad?pedir=1&${RETURN_FLAG}=${code}`
}

export function applySentPath(code: string, id: string): string {
  return `${applyPath(code)}/enviada?solicitud=${id}`
}

export function myApplicationPath(id: string): string {
  return `${MY_APPLICATIONS_PATH}/${id}`
}

export function withdrawnPath(id: string): string {
  return `${MY_APPLICATIONS_PATH}?${WITHDRAWN_FLAG}=${id}`
}
