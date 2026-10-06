import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'

type Props = {
  cover: PetPhotoData | null
  /** Ya traducidos: «Solicitar a Tobi», la foto y la frase de qué es esto. */
  texts: { title: string; photoAlt: string; lead: string }
}

// El nombre y la foto arriba del formulario, para que nadie olvide por quién está escribiendo.
export function ApplicationHeader({ cover, texts }: Props) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <ApplicationPetPhoto cover={cover} alt={texts.photoAlt} size="md" />
        <h1 className="afiche text-2xl break-words text-ink">{texts.title}</h1>
      </div>
      <p className="text-sm text-ink-muted">{texts.lead}</p>
    </header>
  )
}
