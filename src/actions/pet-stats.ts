'use server'

import { litterGroupPost, petGroupPost } from '@/components/pets/group-post-texts'
import { petStatsTexts, type PetStatsView } from '@/components/pets/pet-stats-texts'
import { statsView } from '@/lib/pet-stats/stats-view'
import type { PublicationKind, PublicationStats } from '@/lib/pet-stats/types'
import { petStatsRequestSchema } from '@/lib/schemas/pet-stats'
import { getPublicPet } from '@/lib/supabase/queries/listed-pets'
import { getLitterByCode } from '@/lib/supabase/queries/litters'
import { getMyPublicationStats } from '@/lib/supabase/queries/publication-stats'
import type { GroupPostTexts } from '@/components/pets/group-post-button'
import type { ActionResult } from './result'

const LOAD_ERROR = 'pets.stats.load_error'

// El texto para el grupo del vacío, solo si hoy la publicación lo ofrece; si esa lectura falla, el
// vacío queda con la frase sola y los números igual se ven.
async function emptyGroupPost(
  kind: PublicationKind,
  stats: PublicationStats,
): Promise<GroupPostTexts | null> {
  try {
    if (kind === 'litter') {
      const litter = await getLitterByCode(stats.code)
      return litter !== null && 'code' in litter ? await litterGroupPost(litter) : null
    }
    const pet = await getPublicPet(stats.code)
    return pet !== null && 'code' in pet ? await petGroupPost(pet) : null
  } catch {
    return null
  }
}

// «Cómo le va a…» (historia #269): la página la llama al dibujar y «Probar de nuevo» al reintentar.
// No distingue «no es tuyo» de «falló»: no confirma que la publicación exista (contracts).
export async function readPetStats(input: unknown): Promise<ActionResult<PetStatsView>> {
  const request = petStatsRequestSchema.safeParse(input)
  if (!request.success) return { ok: false, error: LOAD_ERROR }
  try {
    const { kind, id } = request.data
    const stats = await getMyPublicationStats(kind, id)
    if (stats === null) return { ok: false, error: LOAD_ERROR }
    const groupPost = statsView(stats).kind === 'empty' ? await emptyGroupPost(kind, stats) : null
    return { ok: true, data: await petStatsTexts(stats, groupPost) }
  } catch {
    return { ok: false, error: LOAD_ERROR }
  }
}
