type Props = {
  texts: { asked: string; status: string | null }
  verified: boolean
}

// Nunca dice nada del pedido de verificación de la otra persona.
export function IdentityAskLine({ texts, verified }: Props) {
  return (
    <p className="text-sm text-ink">
      {texts.asked}
      {texts.status === null ? null : (
        <span className={verified ? 'text-primary' : 'text-ink-muted'}> {texts.status}</span>
      )}
    </p>
  )
}
