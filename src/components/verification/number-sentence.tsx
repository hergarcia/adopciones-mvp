type Props = {
  /** La frase entera, con `{number}` donde va el número. */
  template: string
  /** Ya en formato de pantalla. */
  number: string
}

// La frase está entera en los mensajes; se parte solo para marcar el número, que es lo que la
// persona necesita confirmar.
export function NumberSentence({ template, number }: Props) {
  const [before, after] = template.split('{number}')
  return (
    <>
      {before}
      <span className="font-medium tabular-nums">{number}</span>
      {after}
    </>
  )
}
