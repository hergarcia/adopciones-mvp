import type { HeldMomentRow } from '@/lib/analytics/application-events'
import { createServiceSupabase } from '@/lib/supabase/service'

// La bandeja de momentos de las solicitudes que esperan la identidad (historia #289, research R10):
// la base los anota al salir o no salir, sin persona ni animal, y la ruta de las publicaciones los
// toma para la medición. Tomarlos los borra.

/** Toma y borra hasta `limit` momentos, más viejos primero. Lanza si la base falla. */
export async function claimHeldMoments(limit: number): Promise<HeldMomentRow[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_held_application_moments', {
    p_limit: limit,
  })
  if (error) throw new Error('No se pudieron tomar los momentos que esperan', { cause: error })
  return data
}
