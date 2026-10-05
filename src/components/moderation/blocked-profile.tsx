type Props = {
  /** Ya traducidos: «Bloqueaste a Ana» y qué significa. */
  title: string
  body: string
  /** `UnblockButton`, que pone la página. */
  unblock: React.ReactNode
  /** Reportar y, para quien administra, suspender: `ProfileSafetyActions`. */
  actions: React.ReactNode
}

// El perfil de alguien que bloqueaste (plan §Perfil bloqueado): solo el nombre, qué significa y las
// acciones; sin foto, nivel ni nada más del perfil. Alineado a la izquierda, como el perfil.
export function BlockedProfile({ title, body, unblock, actions }: Props) {
  return (
    <section className="flex max-w-[var(--measure)] flex-col items-start gap-4">
      <h1 className="afiche text-3xl text-ink">{title}</h1>
      <p className="text-sm text-ink-muted">{body}</p>
      {unblock}
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  )
}
