'use client'

import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { useAcceptCommitment, type CommitmentFailure } from '@/hooks/use-accept-commitment'

type Props = {
  applicationId: string
  /** Ya traducidos: el botón y lo que se dice si no se pudo. */
  texts: { accept: string; failures: Record<CommitmentFailure, string> }
}

// «Acepto el compromiso» (plan §Mi solicitud): la tirita de la pantalla. Lo que no llegó por la
// conexión o el sitio va en la tira de reintentar; la adopción que cambió mientras tanto, en rojo
// arriba del botón, con la pantalla ya recargada.
export function AcceptCommitmentButton({ applicationId, texts }: Props) {
  const flow = useAcceptCommitment(applicationId)
  const kind = flow.failure?.kind
  const network = kind === 'offline' || kind === 'no_response'
  return (
    <div className="flex flex-col items-stretch gap-3 md:items-start">
      {flow.failure !== null && kind !== undefined && !network ? (
        <ErrorText announce>{texts.failures[kind]}</ErrorText>
      ) : null}
      {flow.failure !== null && kind !== undefined && network ? (
        <SaveFailedStrip message={texts.failures[kind]} attempt={flow.failure.attempt} />
      ) : null}
      <Button
        variant="tirita"
        size="lg"
        className="w-full md:w-auto"
        loading={flow.busy}
        onClick={() => void flow.accept()}
      >
        {texts.accept}
      </Button>
    </div>
  )
}
