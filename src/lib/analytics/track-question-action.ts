import { headers } from 'next/headers'
import { questionActionEvent } from './question-events'
import { trackAll } from './track'

/** El toque en la acción de una página de preguntas, contado en la pantalla a la que lleva. */
export async function trackQuestionAction(destination: string): Promise<void> {
  const request = await headers()
  const tap = questionActionEvent({
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
    destination,
  })
  await trackAll(tap === null ? [] : [tap])
}
