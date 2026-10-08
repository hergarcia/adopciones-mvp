import { myApplicationPath } from '@/lib/applications/paths'

/** La marca de Mi solicitud después de mandar el seguimiento: el aviso «Le contaste a … cómo va …». */
export const FOLLOW_UP_SENT_FLAG = 'contado'

export function followUpSentPath(applicationId: string): string {
  return `${myApplicationPath(applicationId)}?${FOLLOW_UP_SENT_FLAG}=1`
}
