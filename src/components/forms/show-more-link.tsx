import { LinkButton } from '@/components/ui/link-button'

type Props = {
  /** La misma pantalla con un tramo más, y el ancla de la última que ya se veía. */
  href: string
  /** Ya traducido. */
  label: string
}

// «Ver más» al pie de una lista de quien administra (Opiniones, las respuestas de Encuestas): trae
// las anteriores sin perder las que ya se ven (FR-045), y el ancla deja la vista donde estaba.
export function ShowMoreLink({ href, label }: Props) {
  return (
    <LinkButton href={href} variant="secondary" className="mt-6">
      {label}
    </LinkButton>
  )
}
