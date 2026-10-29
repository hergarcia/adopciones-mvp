import { after } from 'next/server'
import type { FollowUpSummaryTexts } from '@/components/follow-ups/follow-up-summary'
import type { FollowUpVouchTexts } from '@/components/vouches/follow-up-vouch'
import type { AdoptionRow } from '@/lib/adoptions/types'
import { followUpViewedEvent } from '@/lib/analytics/follow-up-events'
import { trackAll } from '@/lib/analytics/track'
import type { FollowUpRow } from '@/lib/follow-ups/types'
import type { PetPhotoData } from '@/lib/pets/types'
import { getAdoptionOf } from '@/lib/supabase/queries/adoptions'
import { getPublisherApplication } from '@/lib/supabase/queries/application-responses'
import { markFollowUpSeen } from '@/lib/supabase/queries/follow-up-records'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { getPublicProfile, getVouchStanding } from '@/lib/supabase/queries/vouches'
import { publicLevel } from '@/lib/verification/level'
import { followUpVouch } from '@/lib/vouches/follow-up-vouch'
import { NO_STANDING } from '@/lib/vouches/vouch-slot'
import { followUpSummaryTexts, followUpWithPhotos } from './follow-up-texts'
import { viewerLevel } from './viewer-level'
import { followUpVouchTexts } from './vouch-texts'

export type AdopterVouch = {
  view: 'invite' | 'vouching'
  publicId: string
  texts: FollowUpVouchTexts
}

async function markSeen(publisherId: string, applicationId: string) {
  const answeredAt = await markFollowUpSeen(publisherId, applicationId)
  // Corre en `after()`, donde Next no deja leer las cookies: el evento va sin la marca de visita.
  if (answeredAt !== null) {
    await trackAll([followUpViewedEvent(answeredAt, new Date())], { visit: false })
  }
}

// La invitación a avalar a quien adoptó (historia #261). Se pregunta solo con la respuesta a la
// vista, y lo que falle la deja afuera sin tocar el seguimiento: la pantalla se ve como antes.
async function adopterVouch(
  row: FollowUpRow | null,
  adoption: AdoptionRow | null,
  applicationId: string,
  petName: string,
): Promise<AdopterVouch | null> {
  if (row?.status !== 'answered' || row.hidden || adoption === null) return null
  try {
    const [user, application] = await Promise.all([
      getSessionUser(),
      getPublisherApplication(applicationId),
    ])
    const publicId = application?.applicant?.publicId ?? null
    if (user === null || publicId === null) return null
    const [level, standing, profile] = await Promise.all([
      viewerLevel(),
      getVouchStanding(user.id, publicId),
      getPublicProfile(publicId),
    ])
    const view = followUpVouch({
      followUp: row,
      adoption,
      viewerLevelTwo: level.levelTwo,
      adopter: profile === null ? null : { levelTwo: publicLevel(profile) >= 2 },
      standing: standing ?? NO_STANDING,
    })
    if (view.kind === 'none' || profile === null) return null
    return {
      view: view.kind,
      publicId,
      texts: await followUpVouchTexts(profile.displayName, petName),
    }
  } catch {
    return null
  }
}

// El seguimiento de una adopción para quien lo dio (contracts §Rutas): en la pantalla del animal y
// en Una solicitud. La primera vez que ve una respuesta se mide después de responder la página
// (research R11); después de un bloqueo no la ve, así que no cuenta.
export async function publisherFollowUp(
  publisherId: string,
  applicationId: string,
  petName: string,
): Promise<{
  texts: FollowUpSummaryTexts
  photos: PetPhotoData[]
  vouch: AdopterVouch | null
} | null> {
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
  return { texts, photos, vouch: await adopterVouch(row, adoption, applicationId, petName) }
}
