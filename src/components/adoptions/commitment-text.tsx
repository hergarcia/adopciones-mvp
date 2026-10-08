type Props = {
  /** Ya traducidas, con los tres nombres, en el orden de `commitmentClauses`. */
  clauses: string[]
  /** «Es un acuerdo de palabra…»: la última, más chica. */
  note: string
}

// El compromiso de adopción (plan §Diseño): la hoja que se acepta de palabra, en la columna de
// lectura, cada cláusula en su párrafo. Sin firma ni sello: no es un contrato (docs/06). Lo usan
// «¿A quién se lo diste?», Mi solicitud y Una solicitud para el publicador.
export function CommitmentText({ clauses, note }: Props) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col gap-3 border-2 border-ink p-4">
      {clauses.map((clause) => (
        <p key={clause} className="text-base text-ink">
          {clause}
        </p>
      ))}
      <p className="text-sm text-ink-muted">{note}</p>
    </div>
  )
}
