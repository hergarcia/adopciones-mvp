import { TextLink } from '@/components/ui/text-link'
import type { ApplicationTone } from '@/lib/applications/application-view'
import { ApplicationStamp } from './application-stamp'

type Props = {
  /** A la ficha cuando el animal se puede mostrar (FR-065); si no, el nombre sin enlace. */
  href: string | null
  tone: ApplicationTone
  /** Ya traducidos. `since` solo cuando el estado cambió después del envío: si no, repite la fecha. */
  texts: {
    name: string
    stamp: string
    since: string | null
    sentOn: string
    reason: string | null
  }
}

// Arriba de Mi solicitud, al lado de la foto (`ApplicationPetLayout`): el nombre y el sello de su
// estado, que es lo que llama la atención, y cuándo se mandó.
export function ApplicationDetailHeader({ href, tone, texts }: Props) {
  return (
    <header className="flex flex-col items-start gap-3">
      <h1 className="afiche text-2xl break-words text-ink">
        {href === null ? (
          texts.name
        ) : (
          <TextLink href={href} placement="inline">
            {texts.name}
          </TextLink>
        )}
      </h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ApplicationStamp tone={tone} label={texts.stamp} />
        {texts.since === null ? null : (
          <span className="text-sm text-ink-muted tabular-nums">{texts.since}</span>
        )}
      </div>
      {texts.reason === null ? null : <p className="text-sm text-ink-muted">{texts.reason}</p>}
      <p className="text-sm text-ink-muted tabular-nums">{texts.sentOn}</p>
    </header>
  )
}
