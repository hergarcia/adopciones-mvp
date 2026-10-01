import { LinkButton } from '@/components/ui/link-button'
import { Stamp } from '@/components/ui/stamp'

type Props = {
  /** A confirmar el teléfono, con la vuelta a esta pantalla. */
  href: string
  /** Ya traducidos: el sello («Solo la ves vos» en la ficha, «Sin verificar» en la lista). */
  texts: { stamp: string; body: string; action: string }
}

// El publicador sin nivel 1 sabe qué pasa con sus animales (FR-020): el sello del estado en mate
// cocido, porque le toca actuar a él, qué ve quien abre el enlace, y el camino a confirmar el
// teléfono. Sobre piedra y sin borde: es un aviso de la pantalla, no una nota pegada.
export function HiddenFromPublicNotice({ href, texts }: Props) {
  return (
    <section className="flex flex-col items-start gap-3 bg-surface p-4">
      <Stamp tone="warning">{texts.stamp}</Stamp>
      <p className="max-w-[var(--measure)] text-base text-ink">{texts.body}</p>
      <LinkButton href={href} variant="secondary">
        {texts.action}
      </LinkButton>
    </section>
  )
}
