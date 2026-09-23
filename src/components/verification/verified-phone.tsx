import { Card } from '@/components/ui/card'

type Props = {
  /** Ya en formato de pantalla. */
  number: string
  texts: { stamp: string; levelSince: string }
  children?: React.ReactNode
}

// El número verificado con su sello. El estado es un sello porque es eso, un estado que cambia; la
// chapita de cada nivel llega con la historia #12, y acá el nivel se dice en texto (FR-018).
export function VerifiedPhone({ number, texts, children }: Props) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-medium text-ink tabular-nums">{number}</p>
        <span className="sello text-sm text-primary">{texts.stamp}</span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">{texts.levelSince}</p>
      {children}
    </Card>
  )
}
