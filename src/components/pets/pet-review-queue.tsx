import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'

type Props = {
  /** Una por publicación, ya armadas, de la que más espera a la que menos. */
  items: { key: string; node: React.ReactNode }[]
  /** Ya traducidos. */
  texts: { label: string; empty: string; back: string }
  backHref: string
}

// La pila de carteles nuevos que quien administra mira uno por uno (plan §Diseño): una columna con
// divisores, como la lista de pedidos de identidad, sin cards. Vacía, la invitación a volver.
export function PetReviewQueue({ items, texts, backHref }: Props) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={texts.empty}
        action={
          <LinkButton href={backHref} variant="secondary">
            {texts.back}
          </LinkButton>
        }
      />
    )
  }

  return (
    <ul aria-label={texts.label} className="divide-y-2 divide-line border-t-2 border-line">
      {items.map((item) => (
        <li key={item.key} className="py-8">
          {item.node}
        </li>
      ))}
    </ul>
  )
}
