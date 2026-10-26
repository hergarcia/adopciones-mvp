import { Stamp } from '@/components/ui/stamp'
import { ApplicationList } from './application-list'

type Props = {
  /** Ya traducidos: el nombre de la camada, «5 esperan respuesta», «2 nuevas» solo si hay, y la
   *  descripción de la lista para un lector de pantalla. */
  texts: { name: string; waiting: string; fresh: string | null; label: string }
  /** Una `InboxPetCard` por cría, en el orden de la camada. */
  children: React.ReactNode
}

// Una camada en Solicitudes recibidas (historia #206, plan §Diseño): el nombre en afiche, las sumas
// de sus crías con el mismo sello de tinta que una card, y adentro la pared de siempre con una card
// por cría, así 80 solicitudes no son una fila sola.
export function InboxLitterGroup({ texts, children }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col items-start gap-2">
        <h2 className="afiche text-xl break-words text-ink">{texts.name}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {texts.fresh === null ? null : <Stamp tone="ink">{texts.fresh}</Stamp>}
          <span className="text-sm text-ink-muted tabular-nums">{texts.waiting}</span>
        </div>
      </header>
      <ApplicationList label={texts.label}>{children}</ApplicationList>
    </section>
  )
}
