import {
  FEEDBACK_DELETE_OUTCOMES,
  FEEDBACK_OUTCOMES,
  FEEDBACK_SCREENS,
  type FeedbackDeleteOutcome,
  type FeedbackEntry,
  type FeedbackOutcome,
} from '@/lib/feedback/types'
import type { FeedbackPlace } from '@/lib/feedback/screens'
import { createServerSupabase } from '@/lib/supabase/server'
import { UUID } from './applications'
import { NEWEST_CURSOR, readNewest } from './newest-first'
import { oneOf } from './pet-rows'

// Las opiniones (historia #71, research R8, R12). Mandar va con o sin sesión: la función de la base
// no mira quién llama y no guarda nada de la persona. Leer y borrar son de quien administra.

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

/**
 * Las opiniones para quien administra, de la más nueva a la más vieja, las primeras `count`. La base
 * no le devuelve nada a nadie más (research R12).
 */
export async function listFeedback(
  count: number,
): Promise<{ items: FeedbackEntry[]; hasMore: boolean }> {
  const supabase = await createServerSupabase()
  return readNewest<FeedbackEntry>(count, async (after, limit) => {
    const { data, error } = await supabase.rpc('admin_feedback', {
      p_before_on: after?.sentOn ?? NEWEST_CURSOR.day,
      p_before_id: after?.id ?? NEWEST_CURSOR.id,
      p_limit: limit,
    })
    if (error) throw new Error('No se pudieron traer las opiniones', { cause: error })
    return data.map((row) => ({
      id: row.id,
      body: row.body,
      screen: oneOf(FEEDBACK_SCREENS, row.screen, 'pantalla de la opinión'),
      subject: row.subject,
      petName: row.pet_name,
      sentOn: row.sent_on,
    }))
  })
}

/** Borrar una opinión; null si la base no contestó. */
export async function deleteFeedback(id: string): Promise<FeedbackDeleteOutcome | null> {
  if (!UUID.test(id)) return 'not_found'
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_delete_feedback', { p_id: id })
  if (error || data === null) return null
  return oneOf(FEEDBACK_DELETE_OUTCOMES, data, 'resultado de borrar la opinión')
}
