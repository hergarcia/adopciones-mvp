import { Stamp } from '@/components/ui/stamp'

type Props = {
  /** El texto ya trae el día. */
  texts: { stamp: string; text: string }
}

// «Sin verificar» es un estado, así que es un sello; en mate cocido, como «Sin confirmar», porque
// también le toca actuar a la persona. Nunca nada de la cuenta que se quedó con el número (FR-012).
export function NumberLostNotice({ texts }: Props) {
  return (
    <div className="mt-2 flex flex-col items-start">
      <Stamp tone="warning">{texts.stamp}</Stamp>
      <p className="mt-3 text-sm text-ink">{texts.text}</p>
    </div>
  )
}
