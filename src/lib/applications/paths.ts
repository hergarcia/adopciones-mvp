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

/** La camada de la cría que se pide (#205): la vuelta a su ficha si la cría ya no está (FR-032). */
export const LITTER_FLAG = 'camada'

export function applyYoungPath(code: string, litterCode: string): string {
  return `${applyPath(code)}?${LITTER_FLAG}=${litterCode}`
}

// La cría vuelve con su camada: sin ella, verificar el teléfono a mitad de camino perdía de dónde
// venía el pedido (FR-050) y la vuelta si la cría ya no está (FR-032).
export function applyAfterPhonePath(code: string, litterCode: string | null = null): string {
  return applyReturnPath(code, litterCode, AFTER_PHONE)
}

export function applyReturnPath(
  code: string,
  litterCode: string | null,
  after: typeof AFTER_PHONE | typeof AFTER_IDENTITY,
): string {
  const flag = `${AFTER_FLAG}=${after}`
  return litterCode === null
    ? `${applyPath(code)}?${flag}`
    : `${applyYoungPath(code, litterCode)}&${flag}`
}

export function applyAfterIdentityPath(code: string): string {
  return `${applyPath(code)}?${AFTER_FLAG}=${AFTER_IDENTITY}`
}

export function identityForPetPath(code: string): string {
  return `/verificar-identidad?pedir=1&${RETURN_FLAG}=${code}`
}

/** La solicitud desde la que quien publicó pidió la identidad, para volver a ella (historia #257, R7). */
export const APPLICATION_FLAG = 'solicitud'

export function identityForApplicationPath(id: string): string {
  return `/verificar-identidad?pedir=1&${APPLICATION_FLAG}=${id}`
}

export function applySentPath(code: string, id: string): string {
  return `${applyPath(code)}/enviada?solicitud=${id}`
}

export function myApplicationPath(id: string): string {
  return `${MY_APPLICATIONS_PATH}/${id}`
}

const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** El id de una solicitud, para leer la marca `solicitud` sin confiar en lo que trae. */
export const APPLICATION_ID_PATTERN = new RegExp(`^${ID}$`, 'i')

/** Mi solicitud, para reconocerla en la vuelta de la puerta del teléfono (historia #257, R8). */
export const MY_APPLICATION_PATTERN = new RegExp(`^${MY_APPLICATIONS_PATH}/(${ID})$`, 'i')

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

/**
 * La marca de la solicitud después de pedir la identidad (historia #257): el resultado, para el
 * aviso. Lo que no es un pedido hecho también cierra la confirmación, porque la pantalla de atrás ya
 * no la ofrece.
 */
export const IDENTITY_FLAG = 'identidad'

export function identityAskedPath(id: string, outcome: string): string {
  return `${publisherApplicationPath(id)}?${IDENTITY_FLAG}=${outcome}`
}
