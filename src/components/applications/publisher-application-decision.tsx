import {
  acceptedPath,
  askedPath,
  publisherApplicationPath,
  rejectedPath,
  revokedPath,
} from '@/lib/applications/paths'
import type { AcceptOffer, AskOffer } from '@/lib/applications/publisher-actions'
import { verifyPath } from '@/lib/verification/gate'
import { ContactLaterNote } from './contact-later-note'
import { RejectSheet, type RejectSheetTexts } from './reject-sheet'
import { ResponseActions, type ResponseActionsTexts } from './response-actions'

/** Lo que se decide en una solicitud: responder la que espera, o dejar sin efecto la aceptada. */
export type PublisherDecision =
  | {
      kind: 'respond'
      accept: AcceptOffer
      ask: AskOffer | null
      /** Ya traducidos: «El contacto se da al aceptar» y los de responder. */
      texts: { contactLater: string; actions: ResponseActionsTexts }
    }
  | { kind: 'revoke'; texts: RejectSheetTexts }

type Props = { id: string; decision: PublisherDecision }

// La decisión de una solicitud para el publicador. Aceptada, «Dejar sin efecto» ocupa el lugar de
// responder: es la salida de una aceptación que no se concretó (FR-024). Cada acción vuelve a esta
// misma solicitud con su aviso, y sin teléfono la vuelta del aviso de verificación también.
export function PublisherApplicationDecision({ id, decision }: Props) {
  if (decision.kind === 'revoke') {
    return (
      <div>
        <RejectSheet id={id} mode="revoke" doneHref={revokedPath(id)} texts={decision.texts} />
      </div>
    )
  }
  const self = publisherApplicationPath(id)
  return (
    <div className="flex flex-col gap-4">
      <ContactLaterNote text={decision.texts.contactLater} />
      <ResponseActions
        id={id}
        accept={decision.accept}
        ask={decision.ask}
        doneHref={acceptedPath(id)}
        askedHref={askedPath(id)}
        rejectedHref={rejectedPath(id)}
        gateHref={verifyPath({ reason: 'accept', next: self, from: self })}
        texts={decision.texts.actions}
      />
    </div>
  )
}
