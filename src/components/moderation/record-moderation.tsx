'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAnnounce } from '@/components/forms/announce-notices'
import { Button } from '@/components/ui/button'
import { ReactivateSheet, type ReactivateSheetTexts } from './reactivate-sheet'
import type { SuspendSheetTexts } from './suspend-sheet'

// La hoja llega al tocar «Suspender»: la ficha se abre sobre todo para mirar.
const SuspendSheet = dynamic(() => import('./suspend-sheet').then((module) => module.SuspendSheet))

export type RecordModerationTexts = {
  suspend: string
  suspendSheet: SuspendSheetTexts
  /** Ya con el nombre: «Suspendiste a Bruno». */
  suspended: string
  reactivate: ReactivateSheetTexts
}

type Props = {
  publicId: string
  /** La suspensión vigente, o nula si la cuenta no está suspendida. */
  suspensionId: string | null
  texts: RecordModerationTexts
}

// Suspender o reactivar desde la ficha (historia #73, FR-040 a FR-042), con las hojas y las reglas
// de #13. Lo que pase, la ficha lo vuelve a leer: suspendida con su motivo, ya hecha por otra
// persona, o una cuenta que ya no existe.
export function RecordModeration({ publicId, suspensionId, texts }: Props) {
  const router = useRouter()
  const announce = useAnnounce()
  const [open, setOpen] = useState(false)

  if (suspensionId !== null) {
    return (
      <ReactivateSheet key={suspensionId} suspensionId={suspensionId} texts={texts.reactivate} />
    )
  }

  function close() {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {texts.suspend}
      </Button>
      {open ? (
        <SuspendSheet
          publicId={publicId}
          reportId={null}
          origin="record"
          open
          onOpenChange={(next) => (next ? undefined : close())}
          onDone={() => {
            announce(texts.suspended)
            close()
          }}
          onRefused={close}
          texts={texts.suspendSheet}
        />
      ) : null}
    </>
  )
}
