'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { rejectApplication, revokeAcceptance } from '@/actions/application-responses'
import type { CountForms } from '@/components/forms/character-count'
import { Button } from '@/components/ui/button'
import { deferred } from '@/components/ui/deferred'
import { Sheet } from '@/components/ui/sheet'
import { useResponseErrors } from '@/hooks/use-response-errors'
import {
  REJECTION_REASONS,
  REVOCATION_REASONS,
  type RevocationReason,
} from '@/lib/applications/rejection'
import { toFieldError } from '@/lib/schemas/field-error'
import { afterOpenModule } from '@/hooks/use-after-open'
import type { RejectErrors } from './reject-sheet-body'

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
}

type Props = {
  id: string
  /** Rechazar una que espera respuesta, o dejar sin efecto una aceptada (FR-024). */
  mode: 'reject' | 'revoke'
  /** Adónde va al terminar: la misma solicitud con el aviso de lo que se hizo. */
  doneHref: string
  texts: RejectSheetTexts
}

const FAILED = 'inbox.errors.failed'

const MODES = {
  reject: { reasons: REJECTION_REASONS, schema: 'rejectionSchema', action: rejectApplication },
  revoke: { reasons: REVOCATION_REASONS, schema: 'revocationSchema', action: revokeAcceptance },
} as const

type Errors = RejectErrors

const RejectSheetBody = deferred(() =>
  import('./reject-sheet-body').then((module) => module.RejectSheetBody),
)

// El schema llega después de abrir y lo espera el toque que llega antes (historia #304).
const loadSchemas = afterOpenModule(() => import('@/lib/schemas/application-response'))

// Rechazar y dejar sin efecto piden un motivo de la lista y, con «otro», su línea (FR-020, FR-024).
// Lo que falta o sobra se marca en su campo con el mismo schema que la acción, y lo elegido queda; el
// motivo lo ve solo quien publicó, y la hoja lo dice antes de confirmar. Si la solicitud cambió
// mientras tanto, lo dice adentro y la pantalla de atrás se refresca con el estado real (FR-044).
export function RejectSheet({ id, mode, doneHref, texts }: Props) {
  const router = useRouter()
  const { reasons, schema, action } = MODES[mode]
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState<RevocationReason | null>(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  const { message, failure } = useResponseErrors(texts.errors, FAILED)

  async function confirm() {
    if (busy) return
    const input = { id, reason: reason ?? undefined, note }
    setBusy(true)
    const schemas = await loadSchemas().catch(() => null)
    if (schemas === null) {
      setBusy(false)
      setErrors({ form: failure(undefined) })
      return
    }
    const issue = schemas[schema].safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      setBusy(false)
      const { key, values } = toFieldError(issue)
      setErrors(
        issue.path[0] === 'reason'
          ? { reason: message(key) }
          : { note: message(key, values?.fragment) },
      )
      return
    }
    setErrors({})
    const result = await action(input).catch(() => null)
    setBusy(false)
    if (result?.ok) {
      setOpen(false)
      router.push(doneHref)
      return
    }
    setErrors({ form: failure(result?.error) })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setOpen(next)
        if (next) setErrors({})
      }}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant={mode === 'reject' ? 'ghost' : 'ghost-danger'} className="w-full md:w-auto">
          {texts.trigger}
        </Button>
      }
    >
      <RejectSheetBody
        id={id}
        reasons={reasons}
        reason={reason}
        onReason={(value) => {
          setReason(value)
          setErrors({})
        }}
        note={note}
        onNote={setNote}
        errors={errors}
        busy={busy}
        onConfirm={() => void confirm()}
        texts={texts}
      />
    </Sheet>
  )
}
