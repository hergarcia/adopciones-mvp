import { EmptyState } from '@/components/ui/empty-state'

type Props = {
  /** Uno por ítem, ya armados, del que más espera al que menos. */
  items: { key: string; node: React.ReactNode }[]
  /** Ya traducidos. */
  texts: { label: string; empty: string }
}

// La mesa de quien administra, que mira uno por uno: una columna con divisores, como la lista de
// pedidos de identidad, sin cards. Vacía, sin acción: la vuelta a Administrar ya está arriba del
// título (`AdminBackLink`) y una acción aparece una sola vez (docs/10 §Principios).
export function WorkQueue({ items, texts }: Props) {
  if (items.length === 0) return <EmptyState title={texts.empty} />

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
