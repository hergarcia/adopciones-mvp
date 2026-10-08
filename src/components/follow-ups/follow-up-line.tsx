import { Stamp } from '@/components/ui/stamp'

export type FollowUpLineTexts = { kind: 'stamp'; label: string } | { kind: 'text'; text: string }

type Props = {
  /** Ya traducido: el sello de una respondida, o el renglón del pedido o de la que no se respondió. */
  texts: FollowUpLineTexts
}

// El seguimiento debajo de un adoptado en Mis animales (plan §Mis animales): con respuesta, el sello
// en yerba porque es confianza; sin ella, una línea chica que no compite con el talón de la adopción.
export function FollowUpLine({ texts }: Props) {
  if (texts.kind === 'stamp') return <Stamp tone="primary">{texts.label}</Stamp>
  return <p className="text-sm text-ink-muted">{texts.text}</p>
}
