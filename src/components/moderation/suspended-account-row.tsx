type Props = {
  name: string
  /** Ya entre comillas. */
  reason: string
  /** «La suspendió Lucía el 3 de octubre», o una cuenta borrada. */
  by: string
  /** `ReactivateSheet`, que pone la página. */
  action: React.ReactNode
}

// Una cuenta en la lista de suspendidas (plan §Cuentas suspendidas): el nombre en voz de afiche, el
// motivo, quién y cuándo, y «Reactivar». No enlaza al perfil: mientras está suspendida no existe.
export function SuspendedAccountRow({ name, reason, by, action }: Props) {
  return (
    <article className="flex max-w-[var(--measure)] flex-col gap-2">
      <h2 className="afiche text-xl text-ink">{name}</h2>
      <p className="text-base text-ink">{reason}</p>
      <p className="text-sm text-ink-muted">{by}</p>
      <div className="mt-2">{action}</div>
    </article>
  )
}
