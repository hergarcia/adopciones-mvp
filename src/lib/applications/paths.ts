export const MY_APPLICATIONS_PATH = '/mis-solicitudes'

/** La marca de quien vuelve de verificar el teléfono desde «Quiero adoptar» (research R11). */
export const AFTER_FLAG = 'tras'
export const AFTER_PHONE = 'telefono'
/** La confirmación de Mis solicitudes después de retirar. */
export const WITHDRAWN_FLAG = 'retirada'

export function applyPath(code: string): string {
  return `/solicitar/${code}`
}

export function applyAfterPhonePath(code: string): string {
  return `${applyPath(code)}?${AFTER_FLAG}=${AFTER_PHONE}`
}

export function applySentPath(code: string, id: string): string {
  return `${applyPath(code)}/enviada?solicitud=${id}`
}

export function myApplicationPath(id: string): string {
  return `${MY_APPLICATIONS_PATH}/${id}`
}
