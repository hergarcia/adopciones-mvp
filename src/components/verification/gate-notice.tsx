type Props = {
  texts: { title: string; lead: string }
}

// El encabezado del aviso de verificación pendiente: nombra la acción que se tocó y por qué hace
// falta el teléfono (FR-013a).
export function GateNotice({ texts }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-3 text-base text-ink-muted">{texts.lead}</p>
    </>
  )
}
