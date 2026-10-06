import { LinkButton } from '@/components/ui/link-button'
import { MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { LISTING_PATH } from '@/lib/pets/paths'
import { ApplicationStamp } from './application-stamp'

type Props = {
  /** Ya traducidos. */
  texts: { stamp: string; title: string; count: string; toMine: string; toListing: string }
}

// La pantalla cuyo estado es el logro: el sello grande, centrado, que es una confirmación (docs/10
// §Layout), y los dos caminos.
export function ApplicationSent({ texts }: Props) {
  return (
    <section className="flex flex-col items-center gap-4 py-6 text-center">
      <ApplicationStamp tone="ink" size="lg" label={texts.stamp} />
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
