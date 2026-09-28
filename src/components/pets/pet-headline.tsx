import type { Zone } from '@/lib/pets/types'
import { UrgencyTag } from './urgency-tag'
import { ZoneLabel } from './zone-label'

type Props = {
  name: string
  zone: Zone
  isUrgent: boolean
  /** Ya traducidos: «Perro macho, 2 años», «Urgente» y «Publicado hace 3 días». */
  texts: { summary: string; urgent: string; published: string }
}

// El nombre en voz de afiche, lo más grande de la ficha después de la foto (docs/10 §Tipografía,
// `--text-3xl`), y debajo lo que se lee de un vistazo. El nombre entero, en los renglones que haga
// falta.
export function PetHeadline({ name, zone, isUrgent, texts }: Props) {
  return (
    <header className="flex flex-col items-start gap-1">
      <h1 className="afiche text-3xl break-words text-ink">{name}</h1>
      <p className="mt-2 text-base text-ink">{texts.summary}</p>
      <ZoneLabel zone={zone} />
      {isUrgent ? <UrgencyTag label={texts.urgent} /> : null}
      <p className="text-xs text-ink-muted">{texts.published}</p>
    </header>
  )
}
