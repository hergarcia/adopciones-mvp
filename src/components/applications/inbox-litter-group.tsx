import { InboxSection } from './inbox-section'

type Props = {
  /** Ya traducidos: el nombre de la camada, «5 esperan respuesta», «2 nuevas» solo si hay, y la
   *  descripción de la lista para un lector de pantalla. */
  texts: { name: string; waiting: string; fresh: string | null; label: string }
  /** Una `InboxPetCard` por cría, en el orden de la camada. */
  children: React.ReactNode
}

// Las nuevas van en texto: el sello «N nuevas» queda solo en la card de la cría, lo único que llama la
// atención en la bandeja.
export function InboxLitterGroup({ texts, children }: Props) {
  return (
    <InboxSection
      title={texts.name}
      label={texts.label}
      meta={
        <p className="flex flex-wrap gap-x-3 text-sm tabular-nums">
          {texts.fresh === null ? null : <span className="font-bold text-ink">{texts.fresh}</span>}
          <span className="text-ink-muted">{texts.waiting}</span>
        </p>
      }
    >
      {children}
    </InboxSection>
  )
}
