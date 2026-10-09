import { FEEDBACK_OUTCOMES, type FeedbackOutcome } from '@/lib/feedback/types'
import type { FeedbackPlace } from '@/lib/feedback/screens'
import { createServerSupabase } from '@/lib/supabase/server'
import { oneOf } from './pet-rows'

// Las opiniones (historia #71, research R8). Mandar va con o sin sesión: la función de la base no
// mira quién llama y no guarda nada de la persona.

/** Guardar una opinión; null si la base no contestó. */
export async function sendFeedback(input: {
  browserHash: string
  attemptId: string
  body: string
  place: FeedbackPlace
}): Promise<FeedbackOutcome | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('send_feedback', {
    p_browser_hash: input.browserHash,
    p_attempt: input.attemptId,
    p_body: input.body,
    p_screen: input.place.screen,
    ...(input.place.subject === null ? {} : { p_subject: input.place.subject }),
  })
  if (error || data === null) return null
  return oneOf(FEEDBACK_OUTCOMES, data, 'resultado de la opinión')
}
