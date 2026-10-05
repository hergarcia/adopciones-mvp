type Props = {
  texts: { title: string; since: string; reasonLabel: string }
  /** Tal cual lo escribió quien suspendió, ya entre comillas: lo que llama la atención. */
  reason: string
  /** La frase del correo de ayuda, con su enlace. */
  help: React.ReactNode
  /** Borrar la cuenta y salir, que pone la página. */
  actions: React.ReactNode
}

// Lo único que ve una persona suspendida con sesión (plan §Cuenta suspendida): que está
// suspendida, desde cuándo, el motivo, a quién escribir, y las dos salidas de siempre.
export function SuspendedScreen({ texts, reason, help, actions }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="text-sm text-ink-muted tabular-nums">{texts.since}</p>
      <div className="flex flex-col gap-1">
        <p className="text-base text-ink">{texts.reasonLabel}</p>
        <p className="text-base font-medium text-ink">{reason}</p>
      </div>
      <p className="text-base text-ink">{help}</p>
      {actions}
    </section>
  )
}
