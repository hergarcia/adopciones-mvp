import type { ApplyCount, PublicationKind, PublicationStats } from '@/lib/pet-stats/types'
import { SEXES } from '@/lib/pets/options'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { oneOf } from './pet-rows'

// La única puerta a las cuentas de «Cómo le va a…» (historia #269). Sumar es solo del servicio y
// nunca lanza: una cuenta perdida no se reintenta y la persona no se entera (FR-009, SC-004).

const viewerArg = (viewer: string | null) => (viewer === null ? {} : { p_viewer: viewer })

export async function countPublicationOpen(
  kind: PublicationKind,
  code: string,
  viewer: string | null,
): Promise<void> {
  try {
    await createServiceSupabase().rpc(kind === 'pet' ? 'count_pet_open' : 'count_litter_open', {
      p_code: code,
      ...viewerArg(viewer),
    })
  } catch {
    // Se pierde esa apertura: el número puede quedar uno abajo, nunca arriba.
  }
}

export async function countApplyTap(
  code: string,
  viewer: string | null,
  count: ApplyCount,
): Promise<void> {
  if (!count.tap && count.stop === null) return
  try {
    await createServiceSupabase().rpc('count_apply_tap', {
      p_code: code,
      p_tap: count.tap,
      ...viewerArg(viewer),
      ...(count.stop === null ? {} : { p_stop: count.stop }),
    })
  } catch {
    // Se pierde ese toque, como una apertura.
  }
}

/** Los números de una publicación propia, o null si no es suya, no existe o la base falló. */
export async function getMyPublicationStats(
  kind: PublicationKind,
  id: string,
): Promise<PublicationStats | null> {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc(
      'my_publication_stats',
      kind === 'pet' ? { p_pet: id } : { p_litter: id },
    )
    const row = data?.[0]
    if (error || row === undefined) return null
    return {
      opens: row.opens,
      taps: row.taps,
      phoneStops: row.phone_stops,
      identityStops: row.identity_stops,
      applications: row.applications,
      countedSince: row.counted_since,
      fromPublication: row.from_publication,
      requiredLevel: row.required_level === 2 ? 2 : 1,
      code: row.code,
      name: row.name,
      sex: kind === 'pet' ? oneOf(SEXES, row.sex, 'sexo') : null,
    }
  } catch {
    return null
  }
}
