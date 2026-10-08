import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import type { AcceptOffer, AskOffer } from '@/lib/applications/publisher-actions'
import { AcceptDialog, type AcceptTexts } from './accept-dialog'
import { AskQuestionSheet, type AskQuestionTexts } from './ask-question-sheet'
import { RejectSheet, type RejectSheetTexts } from './reject-sheet'

type Props = {
  id: string
  /** Lo que decidió `publisherActions`: aceptar, o frenado por el teléfono de una de las dos. */
  accept: AcceptOffer
  /** Preguntar con cuántas quedan, esperando que conteste, o nada (FR-031). */
  ask: AskOffer | null
  doneHref: string
  /** Adónde va al preguntar: la misma solicitud con el aviso. */
  askedHref: string
  /** Adónde va al rechazar: la misma solicitud con el aviso. */
  rejectedHref: string
  /** El aviso de verificación con la vuelta a esta solicitud (FR-011). */
  gateHref: string
  /**
   * Ya traducidos. `applicantNeedsPhone`: «Ana tiene que volver a verificar su teléfono…»;
   * `askPending`: «Le preguntaste algo; esperás que conteste.».
   */
  texts: {
    accept: AcceptTexts
    applicantNeedsPhone: string
    ask: AskQuestionTexts
    askPending: string
    reject: RejectSheetTexts
  }
}

// Al pie de una solicitud que espera respuesta (plan §Diseño): «Aceptar» es la tirita. Sin el
// teléfono propio, la tirita lleva al aviso de verificación; sin el de quien solicitó, queda apagada
// con la línea que dice por qué, en mate cocido porque le toca actuar a alguien. «Rechazar» pesa
// menos y se puede siempre, también sin teléfono (FR-011). «Pedir más información» va en el medio
// mientras queden preguntas; con una sin contestar, en su lugar la línea que dice que se espera.
export function ResponseActions({
  id,
  accept,
  ask,
  doneHref,
  askedHref,
  rejectedHref,
  gateHref,
  texts,
}: Props) {
  return (
    <div className="flex flex-col items-stretch gap-3 md:items-start">
      {accept === 'offer' ? (
        <AcceptDialog id={id} doneHref={doneHref} texts={texts.accept} />
      ) : accept === 'publisher_needs_phone' ? (
        <LinkButton href={gateHref} variant="tirita" size="lg" className="w-full md:w-auto">
          {texts.accept.trigger}
        </LinkButton>
      ) : (
        <>
          <Button variant="tirita" size="lg" disabled className="w-full md:w-auto">
            {texts.accept.trigger}
          </Button>
          <p className="text-sm text-warning">{texts.applicantNeedsPhone}</p>
        </>
      )}
      {ask === null ? null : ask.kind === 'pending' ? (
        <p className="text-sm text-ink-muted">{texts.askPending}</p>
      ) : (
        <AskQuestionSheet id={id} doneHref={askedHref} texts={texts.ask} />
      )}
      <RejectSheet id={id} mode="reject" doneHref={rejectedHref} texts={texts.reject} />
    </div>
  )
}
