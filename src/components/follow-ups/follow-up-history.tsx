type Props = {
  /** Ya traducidas y sin cero: «Dio 2 adopciones con seguimiento», «Adoptó 1 animal con seguimiento». */
  lines: string[]
}

// El historial como un renglón escrito en la nota de la persona (plan §Perfil público y ficha): en
// tinta porque es un hecho, sin borde ni fondo porque no es un sello —el sello de la nota es el nivel—
// y sin enlace ni animales. Sin ninguna, nada.
export function FollowUpHistory({ lines }: Props) {
  if (lines.length === 0) return null
  return (
    <ul className="flex flex-col text-sm text-ink">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
