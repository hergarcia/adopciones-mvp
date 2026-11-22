import { FollowUpAnswer } from '@/components/follow-ups/follow-up-answer'
import { FollowUpFormSkeleton } from '@/components/follow-ups/follow-up-form-skeleton'
import { FollowUpRequest } from '@/components/follow-ups/follow-up-request'
import { laterForm } from '@/components/forms/later-part'
import type { FollowUpView } from '@/lib/follow-ups/follow-up-view'
import type { PetPhotoData } from '@/lib/pets/types'
import { followUpAnswerTexts, followUpRequestTexts } from './follow-up-texts'

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
    const [texts, part] = await Promise.all([
      followUpRequestTexts({ pet: names.pet, publisher: names.publisher }),
      laterForm(<FollowUpFormSkeleton />),
    ])
    return <FollowUpRequest applicationId={applicationId} texts={texts} part={part} />
  }
  if (view.kind !== 'answer') return null
  return (
    <FollowUpAnswer photos={photos} texts={await followUpAnswerTexts(view, 'adopter', names)} />
  )
}
