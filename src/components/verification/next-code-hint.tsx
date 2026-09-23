type Props = {
  /** Ya decidido por `retryText`; sin texto no se pinta nada. */
  text: string | null
}

// Cuándo se puede pedir otro, afuera del botón y no adentro: un botón deshabilitado se dibuja al
// 50 % y ahí el texto queda en 3:1, y esto lleva información. Sin `aria-live`: cambia una vez por
// segundo, y anunciarlo serían sesenta anuncios seguidos (docs/10 §Piso de accesibilidad).
export function NextCodeHint({ text }: Props) {
  if (text === null) return null
  return <p className="text-sm text-ink-muted">{text}</p>
}
