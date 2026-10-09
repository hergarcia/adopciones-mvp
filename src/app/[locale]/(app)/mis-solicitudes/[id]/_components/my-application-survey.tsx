import type { ApplicationStatus, CloseReason } from '@/lib/applications/types'
import { surveyFor } from '@/lib/supabase/queries/surveys'
import { OfferedSurvey } from '@/app/[locale]/_components/offered-survey'

type Props = {
  applicationId: string
  status: ApplicationStatus
  closeReason: CloseReason | null
}

// Mi solicitud ofrece la encuesta de su desenlace (contracts §Rutas): la elegida, la de quien
// adoptó; rechazada, sin efecto o cerrada porque el animal encontró hogar, la de no ser elegida.
// Cuál corresponde de verdad lo decide la base, que también mira «Yo no adopté» y el arranque.
export async function MyApplicationSurvey({ applicationId, status, closeReason }: Props) {
  const moment =
    closeReason === 'handed_over'
      ? 'adopted'
      : status === 'rejected' || closeReason === 'adopted'
        ? 'not_chosen'
        : null
  if (moment === null) return null
  const offer = await surveyFor(moment, applicationId)
  return offer === null ? null : <OfferedSurvey offer={offer} />
}
