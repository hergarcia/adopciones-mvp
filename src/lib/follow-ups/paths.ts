import { myApplicationPath } from '@/lib/applications/paths'

/** La marca de Mi solicitud después de mandar el seguimiento: el aviso «Le contaste a … cómo va …». */
export const FOLLOW_UP_SENT_FLAG = 'contado'

export function followUpSentPath(applicationId: string): string {
  return `${myApplicationPath(applicationId)}?${FOLLOW_UP_SENT_FLAG}=1`
}

/**
 * La marca de Mi solicitud cuando el pedido se cerró mientras se armaba la respuesta: el formulario
 * ya no está en la pantalla nueva, así que el aviso «Ya no se puede contar cómo va …» viaja en ella.
 */
export const FOLLOW_UP_CLOSED_FLAG = 'sin-seguimiento'

export function followUpClosedPath(applicationId: string): string {
  return `${myApplicationPath(applicationId)}?${FOLLOW_UP_CLOSED_FLAG}=1`
}
