'use client'

import { useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { Button } from '@/components/ui/button'
import { deferredPart, type LaterPart } from '@/components/ui/deferred-part'
import { Sheet } from '@/components/ui/sheet'
import type { RevocationReason } from '@/lib/applications/rejection'

export type RejectSheetTexts = {
  trigger: string
  title: string
  legend: string
  /** Los de dejar sin efecto suman «La adopción no se concretó». */
  reasons: Record<RevocationReason, string>
  noteLabel: string
  private: string
  confirm: string
  cancel: string
  close: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `inbox.errors`; los de contacto, crudos con `{fragment}`. */
  errors: Record<string, string>
  /** La espera de los motivos, la nota y los botones, y el aviso si no llegan. */
  part: LaterPart
}

type Props = {
  id: string
  /** Rechazar una que espera respuesta, o dejar sin efecto una aceptada (FR-024). */
  mode: 'reject' | 'revoke'
  /** Adónde va al terminar: la misma solicitud con el aviso de lo que se hizo. */
  doneHref: string
  texts: RejectSheetTexts
}

// Los motivos, la nota y lo que rechaza llegan después de abrir (historias #304 y #316).
const RejectSheetBody = deferredPart(
  () => import('./reject-sheet-body').then((module) => module.RejectSheetBody),
  true,
)

// Rechazar y dejar sin efecto piden un motivo de la lista y, con «otro», su línea (FR-020, FR-024).
// Lo elegido y lo escrito quedan acá, así siguen si se cierra la hoja y se vuelve a abrir; mientras
// corre, la hoja no se cierra.
export function RejectSheet({ id, mode, doneHref, texts }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState<RevocationReason | null>(null)
  const [note, setNote] = useState('')

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (busy ? undefined : setOpen(next))}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant={mode === 'reject' ? 'ghost' : 'ghost-danger'} className="w-full md:w-auto">
          {texts.trigger}
        </Button>
      }
    >
      <RejectSheetBody
        part={texts.part}
        props={{
          id,
          mode,
          doneHref,
          texts,
          reason,
          onReason: setReason,
          note,
          onNote: setNote,
          busy,
          onBusy: setBusy,
          close: () => setOpen(false),
        }}
      />
    </Sheet>
  )
}
