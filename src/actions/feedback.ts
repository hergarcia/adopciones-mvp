'use server'

import { revalidatePath } from 'next/cache'
import { feedbackSentEvent } from '@/lib/analytics/survey-events'
import { trackAll } from '@/lib/analytics/track'
import { feedbackBrowserHash } from '@/lib/feedback/browser'
import { feedbackOutcome } from '@/lib/feedback/outcomes'
import { FEEDBACK_LIST_PATH } from '@/lib/feedback/paths'
import { feedbackScreen } from '@/lib/feedback/screens'
import { feedbackSchema } from '@/lib/schemas/feedback'
import { toFieldError } from '@/lib/schemas/field-error'
import {
  deleteFeedback as deleteFeedbackRecord,
  sendFeedback as sendFeedbackRecord,
} from '@/lib/supabase/queries/feedback'
import type { ActionResult } from './result'

const FAILED = 'feedback.errors.failed'
const FAILED_DELETE = 'feedback.errors.delete_failed'

/** El error de contacto trae lo que encontró, para citarlo (como las preguntas de #65). */
export type FeedbackSent = ActionResult<null, { fragment: string }>

// «Enviar» en Opinar (FR-021 a FR-025), con o sin sesión: la sesión no se mira y nada de la persona
// llega a la base. El formulario no valida en el navegador, así no baja zod a la pantalla: la regla
// vive solo acá. La pantalla la decide el servidor a partir de la ruta, así nadie escribe cualquier
// cosa en ella (research R9). El intento que ya había llegado termina como un envío, sin medir otra
// vez.
export async function sendFeedback(input: unknown): Promise<FeedbackSent> {
  const parsed = feedbackSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    if (issue === undefined) return { ok: false, error: FAILED }
    const { key, values } = toFieldError(issue)
    return { ok: false, error: key, ...(values === undefined ? {} : { detail: values }) }
  }

  try {
    const { attemptId, body, path } = parsed.data
    const place = feedbackScreen(path)
    const outcome = await sendFeedbackRecord({
      browserHash: await feedbackBrowserHash(),
      attemptId,
      body,
      place,
    })
    if (outcome === null) return { ok: false, error: FAILED }
    const result = feedbackOutcome(outcome)
    if (!result.ok) return result
    if (outcome === 'sent') await trackAll([feedbackSentEvent(place.screen)])
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}

// «Borrar» en Opiniones (FR-041): para siempre. La base vuelve a preguntar si quien llama administra;
// si no, la opinión no existe para esa persona. La que ya no estaba —otra pestaña, otra persona que
// administra— se dice como tal y la lista se vuelve a pintar sin ella.
export async function deleteFeedback(input: { id: string }): Promise<ActionResult<null>> {
  try {
    const outcome = await deleteFeedbackRecord(typeof input?.id === 'string' ? input.id : '')
    if (outcome === null) return { ok: false, error: FAILED_DELETE }
    revalidatePath(FEEDBACK_LIST_PATH)
    if (outcome === 'not_found') return { ok: false, error: 'feedback.errors.not_found' }
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED_DELETE }
  }
}
