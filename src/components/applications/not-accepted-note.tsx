import { TextLink } from '@/components/ui/text-link'

type Props = {
  href: string
  /** Ya traducidos: que no fue aceptada y el camino a Animales en adopción. */
  texts: { body: string; toListing: string }
}

// A quien rechazaron, en la ficha y en Mi solicitud: una frase y el camino al listado. Sin el motivo
// (FR-021), sin tirita ni sello: no es un estado del animal.
export function NotAcceptedNote({ href, texts }: Props) {
  return (
    <div className="flex flex-col items-start gap-1">
      <p className="text-base text-ink">{texts.body}</p>
      <TextLink href={href}>{texts.toListing}</TextLink>
    </div>
  )
}
