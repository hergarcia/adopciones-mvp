import { TextLink } from '@/components/ui/text-link'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicantHeader, type ApplicantHeaderProps } from './applicant-header'
import { ApplicationPetPhoto } from './application-pet-photo'
import {
  PublisherApplicationState,
  type PublisherApplicationStateProps,
} from './publisher-application-state'

type Props = {
  cover: PetPhotoData | null
  /** A las de ese animal, o a Solicitudes cuando el animal ya no está. */
  backHref: string
  /** Quién la mandó; sin su cuenta, el nombre del animal hace de título. */
  applicant: ApplicantHeaderProps | null
  state: PublisherApplicationStateProps
  /** Ya traducidos: el alt de la foto, «Solicitudes por Nube» y el nombre del animal. */
  texts: { photoAlt: string; back: string; petName: string }
}

// Arriba de una solicitud para el publicador: la foto chica del animal al lado de la vuelta, así
// quien tiene varios sabe por cuál es sin leer; después quién es y el sello de su estado.
export function PublisherApplicationHead({ cover, backHref, applicant, state, texts }: Props) {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <div className="w-20 shrink-0">
          <ApplicationPetPhoto cover={cover} alt={texts.photoAlt} sizes="80px" eager />
        </div>
        <TextLink href={backHref} prefetch={false}>
          {texts.back}
        </TextLink>
      </div>
      {applicant === null ? (
        <h1 className="afiche text-2xl break-words text-ink">{texts.petName}</h1>
      ) : (
        <ApplicantHeader {...applicant} />
      )}
      <PublisherApplicationState {...state} />
    </div>
  )
}
