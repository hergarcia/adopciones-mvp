type Props = {
  /** Ya traducidos: «Solicitar a Tobi» y la frase de qué es esto. */
  texts: { title: string; lead: string }
}

// El nombre arriba del formulario, al lado de su foto (`ApplicationPetLayout`).
export function ApplicationHeader({ texts }: Props) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="afiche text-2xl break-words text-ink">{texts.title}</h1>
      <p className="text-sm text-ink-muted">{texts.lead}</p>
    </header>
  )
}
