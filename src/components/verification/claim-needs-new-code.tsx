import { SingleTaskColumns } from '@/components/forms/single-task-columns'
import { NumberSentence } from './number-sentence'
import { VerifyHeading } from './verify-heading'

type Props = {
  /** `lead` con `{number}` adentro cuando viene `number`. */
  texts: { title: string; lead: string }
  /** El número de la prueba, si la persona todavía lo tiene a la vista. */
  number?: string
  /** El pedido a un toque con el número a la vista, o el acceso a «Verificar teléfono». */
  children: React.ReactNode
  /** «Ahora no», cuando se llegó por la puerta de una acción. */
  notNow?: React.ReactNode
}

// Reemplaza la pantalla entera, encabezado incluido, cuando la prueba ya no vale: un solo mensaje
// para vencida, reemplazada o usada por otra cuenta (FR-008).
export function ClaimNeedsNewCode({ texts, number, children, notNow = null }: Props) {
  const lead = number ? <NumberSentence template={texts.lead} number={number} /> : texts.lead
  return (
    <SingleTaskColumns
      presentation={
        <div role="alert">
          <VerifyHeading texts={{ title: texts.title, lead }} />
        </div>
      }
      task={
        <div className="mt-8 flex flex-col">
          <div className="flex flex-col gap-2">{children}</div>
          {notNow}
        </div>
      }
    />
  )
}
