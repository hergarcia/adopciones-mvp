import { applicationClosedEvents } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import { closedApplicationsSince, type ClosureScope } from '@/lib/supabase/queries/applications'

// Los cierres los escribe un trigger, así que la acción que los provocó pregunta después cuáles
// hubo desde que empezó (R11). Medir no cambia su resultado: si la pregunta falla, no se registra.
export async function trackApplicationClosures(
  since: Date,
  scope: ClosureScope,
  options?: { visit?: boolean },
) {
  await trackAll(applicationClosedEvents(await closedApplicationsSince(since, scope)), options)
}
