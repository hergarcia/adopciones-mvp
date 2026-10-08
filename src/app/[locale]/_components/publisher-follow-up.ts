import { after } from 'next/server'
import type { FollowUpSummaryTexts } from '@/components/follow-ups/follow-up-summary'
import { followUpViewedEvent } from '@/lib/analytics/follow-up-events'
import { trackAll } from '@/lib/analytics/track'
import type { PetPhotoData } from '@/lib/pets/types'
import { getAdoptionOf } from '@/lib/supabase/queries/adoptions'
import { markFollowUpSeen } from '@/lib/supabase/queries/follow-up-records'
import { followUpSummaryTexts, followUpWithPhotos } from './follow-up-texts'

async function markSeen(publisherId: string, applicationId: string) {
  const answeredAt = await markFollowUpSeen(publisherId, applicationId)
  // Corre en `after()`, donde Next no deja leer las cookies: el evento va sin la marca de visita.
  if (answeredAt !== null) {
    await trackAll([followUpViewedEvent(answeredAt, new Date())], { visit: false })
  }
}

// El seguimiento de una adopción para quien lo dio (contracts §Rutas): en la pantalla del animal y
// en Una solicitud. La primera vez que ve una respuesta se mide después de responder la página
// (research R11); después de un bloqueo no la ve, así que no cuenta.
export async function publisherFollowUp(
  publisherId: string,
  applicationId: string,
  petName: string,
): Promise<{ texts: FollowUpSummaryTexts; photos: PetPhotoData[] } | null> {
  const [{ row, photos }, adoption] = await Promise.all([
    followUpWithPhotos(applicationId),
    getAdoptionOf(applicationId),
  ])
  const texts = await followUpSummaryTexts(row, {
    pet: petName,
    adopter: adoption?.adopterName ?? '',
  })
  if (texts === null) return null
  if (row?.status === 'answered' && !row.hidden) after(() => markSeen(publisherId, applicationId))
  return { texts, photos }
}
