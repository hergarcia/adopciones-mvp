import { Card } from '@/components/ui/card'

type Props = {
  /** Ya en formato de pantalla. */
  number: string
  texts: {
    stamp: string
    body: string
    /** Solo en un cambio: "si cancelás, vuelve el…". El anterior no se muestra como verificado
     *  mientras la cuenta está sin verificar (FR-018). */
    restores?: string
  }
  children?: React.ReactNode
}

export function PendingPhoneNotice({ number, texts, children }: Props) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-medium text-ink tabular-nums">{number}</p>
        <span className="sello text-sm text-warning">{texts.stamp}</span>
      </div>
      <p className="mt-2 text-sm text-ink">
        {texts.body}
        {texts.restores ? ` ${texts.restores}` : null}
      </p>
      {children}
    </Card>
  )
}
