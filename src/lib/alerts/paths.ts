export const MY_ALERTS_PATH = '/mis-avisos'

const UNSUBSCRIBE_PATH = '/dejar-de-recibir'

/** «Dejar de recibir» de un correo de avisos: el token y nada más, sin nada de la persona. */
export function unsubscribePath(token: string): string {
  return `${UNSUBSCRIBE_PATH}/${token}`
}

/** La marca del listado que pide crear el aviso al volver de entrar (research R8). */
export const ALERT_PARAM = 'avisar'

/** La dirección del listado con la marca: a donde vuelve quien entra para crear el aviso. */
export function withAlertParam(href: string): string {
  return `${href}${href.includes('?') ? '&' : '?'}${ALERT_PARAM}=1`
}
