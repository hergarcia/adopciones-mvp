// Cuántos hay con los filtros puestos (FR-015), en un `output` que se anuncia al cambiar: quien no
// ve la pantalla se entera del total nuevo al marcar un filtro.
export function ListingCount({ text }: { text: string }) {
  return (
    <output aria-live="polite" className="block text-sm text-ink-muted">
      {text}
    </output>
  )
}
