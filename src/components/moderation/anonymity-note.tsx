type Props = {
  /** Ya traducido, con el nombre adentro. */
  text: string
}

// Lo que más le importa a quien reporta: que la otra persona no se entera. Un bloque de papel
// distinto del formulario, en el tono de las notas (plan §Reportar).
export function AnonymityNote({ text }: Props) {
  return <p className="w-full bg-surface p-4 text-sm text-ink">{text}</p>
}
