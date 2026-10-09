type Props = {
  /** Ya traducidos: «Espera a otra persona que administre» y una frase por pendiente. */
  title: string
  items: { key: string; text: string }[]
}

// Lo de quien mira, aparte y sin sello: no cuenta ni atrasa ninguna cola (FR-013). Sin nada propio
// no se muestra.
export function OwnPendingList({ title, items }: Props) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <ul className="flex max-w-[var(--measure)] flex-col gap-2">
        {items.map((item) => (
          <li key={item.key} className="text-base text-ink-muted">
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
