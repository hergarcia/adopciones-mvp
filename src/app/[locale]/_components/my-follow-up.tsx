import { FollowUpAnswer } from '@/components/follow-ups/follow-up-answer'
import { FollowUpForm } from '@/components/follow-ups/follow-up-form'
import type { FollowUpView } from '@/lib/follow-ups/follow-up-view'
import type { PetPhotoData } from '@/lib/pets/types'
import { followUpAnswerTexts, followUpFormTexts } from './follow-up-texts'

type Props = {
  applicationId: string
  view: FollowUpView
  photos: PetPhotoData[]
  names: { pet: string; publisher: string; adopter: string }
}

// El seguimiento en Mi solicitud (plan §Mi solicitud): el formulario mientras el pedido está abierto,
// la respuesta con el sello después; antes del pedido o cerrado, nada.
export async function MyFollowUp({ applicationId, view, photos, names }: Props) {
  if (view.kind === 'form') {
    return (
      <FollowUpForm
        applicationId={applicationId}
        texts={await followUpFormTexts({ pet: names.pet, publisher: names.publisher })}
      />
    )
  }
  if (view.kind !== 'answer') return null
  return (
    <FollowUpAnswer photos={photos} texts={await followUpAnswerTexts(view, 'adopter', names)} />
  )
}
