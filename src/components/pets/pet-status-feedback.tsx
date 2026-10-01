'use client'

import { useRouter } from 'next/navigation'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Toast } from '@/components/ui/toast'
import type { PetStatusFlow } from '@/hooks/use-pet-status'
import type { PetStatusTexts } from './pet-status-actions'
import { SaveBlockedDialog } from './save-blocked-dialog'

type Props = { flow: PetStatusFlow; texts: PetStatusTexts }

// Una acción que no llegó: qué pasó y que se toque de nuevo el botón que ya está en pantalla, con su
// nombre (FR-007, docs/10 §Principios 6). Sin un «Reintentar» al lado: sería la misma acción dos
// veces.
export function PetStatusFailureStrip({ flow, texts }: Props) {
  if (flow.failure === null) return null
  return (
    <SaveFailedStrip
      message={texts.failures[flow.failure.kind][flow.failure.action]}
      attempt={flow.failure.attempt}
    />
  )
}

// Cómo terminó, fuera de la hoja: el aviso corto y, si falta el teléfono, el de verificación
// pendiente, que lleva a confirmarlo y vuelve a esta pantalla.
export function PetStatusNotices({ flow, texts, gateHref }: Props & { gateHref: string }) {
  const router = useRouter()
  return (
    <>
      {flow.toast ? (
        <Toast
          key={flow.toast.key}
          open
          onOpenChange={(next) => (next ? undefined : flow.closeToast())}
          message={flow.toast.message}
          variant={flow.toast.variant}
          closeLabel={texts.toastClose}
        />
      ) : null}
      <SaveBlockedDialog
        open={flow.needsPhone}
        texts={texts.gate}
        onAction={() => router.push(gateHref)}
        onStay={flow.closePhone}
      />
    </>
  )
}
