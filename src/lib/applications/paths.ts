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

/** Solicitudes: la bandeja del publicador (research R8). */
export const INBOX_PATH = '/solicitudes'
/** La marca de una solicitud recién aceptada: ofrece «En proceso» (FR-017). */
export const ACCEPTED_FLAG = 'aceptada'

export function petInboxPath(petId: string): string {
  return `${INBOX_PATH}/animal/${petId}`
}

export function publisherApplicationPath(id: string): string {
  return `${INBOX_PATH}/${id}`
}

export function acceptedPath(id: string): string {
  return `${publisherApplicationPath(id)}?${ACCEPTED_FLAG}=1`
}

/** «Abrir WhatsApp»: la ruta propia que mide y redirige (research R9). */
export function whatsappRoutePath(id: string): string {
  return `/api/solicitudes/${id}/whatsapp`
}

/** Las marcas de una recién rechazada o dejada sin efecto: el aviso con lo que se hizo. */
export const REJECTED_FLAG = 'rechazada'
export const REVOKED_FLAG = 'sin-efecto'

export function rejectedPath(id: string): string {
  return `${publisherApplicationPath(id)}?${REJECTED_FLAG}=1`
}

export function revokedPath(id: string): string {
  return `${publisherApplicationPath(id)}?${REVOKED_FLAG}=1`
}

/** La marca de una pregunta recién enviada: el aviso de que se le avisa por correo. */
export const ASKED_FLAG = 'preguntada'

export function askedPath(id: string): string {
  return `${publisherApplicationPath(id)}?${ASKED_FLAG}=1`
}

/** La marca de Mi solicitud recién contestada una pregunta: el aviso de «Respuesta enviada». */
export const ANSWERED_FLAG = 'respondida'

export function answeredPath(id: string): string {
  return `${myApplicationPath(id)}?${ANSWERED_FLAG}=1`
}
