import { TextLink } from '@/components/ui/text-link'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'
import { ApplicationStamp } from './application-stamp'
import type { ApplicationTone } from '@/lib/applications/application-view'

type Props = {
  cover: PetPhotoData | null
  /** A la ficha cuando el animal se puede mostrar (FR-065); si no, el nombre sin enlace. */
  href: string | null
  tone: ApplicationTone
  /** Ya traducidos. */
  texts: {
    name: string
    photoAlt: string
    stamp: string
    since: string
    sentOn: string
    reason: string | null
  }
}

// Arriba de Mi solicitud: el animal y el sello de su estado, que es lo que llama la atención.
export function ApplicationDetailHeader({ cover, href, tone, texts }: Props) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ApplicationPetPhoto cover={cover} alt={texts.photoAlt} size="md" />
        <h1 className="afiche text-2xl break-words text-ink">
          {href === null ? (
            texts.name
          ) : (
            <TextLink href={href} placement="inline">
              {texts.name}
            </TextLink>
          )}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ApplicationStamp tone={tone} label={texts.stamp} />
        <span className="text-sm text-ink-muted tabular-nums">{texts.since}</span>
      </div>
      {texts.reason === null ? null : <p className="text-sm text-ink-muted">{texts.reason}</p>}
      <p className="text-sm text-ink-muted tabular-nums">{texts.sentOn}</p>
    </header>
  )
}
