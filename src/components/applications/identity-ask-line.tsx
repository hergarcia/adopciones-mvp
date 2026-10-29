type Props = {
  /** Ya traducidos: «Le pediste la identidad el 29/10.» y, mientras espera, «Todavía no la verificó.». */
  texts: { asked: string; status: string | null }
}

// Debajo del estado de una solicitud para quien publicó (plan §Diseño): el día del pedido en tinta y,
// mientras el pedido sigue abierto, que todavía no la verificó, más bajo. Con la solicitud cerrada sin
// aprobarse queda solo el día (FR-013). Nunca dice nada del pedido de verificación de la otra persona
// (FR-012).
export function IdentityAskLine({ texts }: Props) {
  return (
    <p className="text-sm text-ink tabular-nums">
      {texts.asked}
      {texts.status === null ? null : <span className="text-ink-muted"> {texts.status}</span>}
    </p>
  )
}
