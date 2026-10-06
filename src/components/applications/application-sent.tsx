import { LinkButton } from '@/components/ui/link-button'
import { MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { LISTING_PATH } from '@/lib/pets/paths'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'
import { ApplicationStamp } from './application-stamp'

type Props = {
  cover: PetPhotoData | null
  /** Ya traducidos. */
  texts: {
    photoAlt: string
    stamp: string
    title: string
    count: string
    toMine: string
    toListing: string
  }
}

// La pantalla cuyo estado es el logro: el animal pegado con el sello grande encima —foto pegada más
// sello, el gesto que docs/10 permite—, centrado porque es una confirmación (docs/10 §Layout), y los
// dos caminos. Se centra sobre el ancho que le den: va en `PageShell` `full`, sobre la hoja entera.
export function ApplicationSent({ cover, texts }: Props) {
  const stamp = <ApplicationStamp tone="ink" size="lg" label={texts.stamp} />
  return (
    <section className="flex flex-col items-center gap-4 py-6 text-center">
      {cover === null ? (
        stamp
      ) : (
        <div className="mb-2 w-48 md:w-56">
          <ApplicationPetPhoto
            cover={cover}
            alt={texts.photoAlt}
            stamp={stamp}
            sizes="224px"
            eager
          />
        </div>
      )}
      <h1 className="afiche max-w-[24ch] text-2xl break-words text-ink">{texts.title}</h1>
      <p className="text-sm text-ink-muted">{texts.count}</p>
      <div className="flex flex-col items-center gap-3">
        <LinkButton href={MY_APPLICATIONS_PATH} variant="secondary">
          {texts.toMine}
        </LinkButton>
        <LinkButton href={LISTING_PATH} variant="ghost">
          {texts.toListing}
        </LinkButton>
      </div>
    </section>
  )
}
