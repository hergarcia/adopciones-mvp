import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import type { AcceptOffer } from '@/lib/applications/publisher-actions'
import { AcceptDialog, type AcceptTexts } from './accept-dialog'

type Props = {
  id: string
  /** Lo que decidió `publisherActions`: aceptar, o frenado por el teléfono de una de las dos. */
  accept: AcceptOffer
  doneHref: string
  /** El aviso de verificación con la vuelta a esta solicitud (FR-011). */
  gateHref: string
  /** Ya traducidos. `applicantNeedsPhone`: «Ana tiene que volver a verificar su teléfono…». */
  texts: { accept: AcceptTexts; applicantNeedsPhone: string }
}

// Al pie de una solicitud que espera respuesta (plan §Diseño): «Aceptar» es la tirita. Sin el
// teléfono propio, la tirita lleva al aviso de verificación; sin el de quien solicitó, queda apagada
// con la línea que dice por qué, en mate cocido porque le toca actuar a alguien.
export function ResponseActions({ id, accept, doneHref, gateHref, texts }: Props) {
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
    </div>
  )
}
