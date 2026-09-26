import { NumberSentence } from './number-sentence'
import { VerifyHeading } from './verify-heading'

type Props = {
  /** `lead` con `{number}` adentro cuando viene `number`. */
  texts: { title: string; lead: string }
  /** El número de la prueba, si la persona todavía lo tiene a la vista. */
  number?: string
  /** El pedido a un toque con el número a la vista, o el acceso a «Verificar teléfono». */
  children: React.ReactNode
}

// Reemplaza la pantalla entera, encabezado incluido, cuando la prueba ya no vale: un solo mensaje
// para vencida, reemplazada o usada por otra cuenta (FR-008).
export function ClaimNeedsNewCode({ texts, number, children }: Props) {
  return (
    <div className="flex flex-col">
      <div role="alert">
        <VerifyHeading texts={{ title: texts.title, lead: null }} />
        <p className="mt-3 text-base text-ink-muted">
          {number ? <NumberSentence template={texts.lead} number={number} /> : texts.lead}
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-2">{children}</div>
    </div>
  )
}
