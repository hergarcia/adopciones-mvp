'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { rejectApplication, revokeAcceptance } from '@/actions/application-responses'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { RadioGroup } from '@/components/ui/radio-group'
import { Sheet, SheetClose } from '@/components/ui/sheet'
import {
  REJECTION_REASONS,
  REVOCATION_REASONS,
  type RevocationReason,
} from '@/lib/applications/rejection'
import { REJECTION_NOTE_MAX_LENGTH } from '@/lib/applications/rules'
import { toFieldError } from '@/lib/schemas/field-error'
import { rejectionSchema, revocationSchema } from '@/lib/schemas/application-response'
import { FormNote } from './form-note'

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
// El contador aparece cuando faltan 50: antes no hace falta mirarlo.
const COUNTER_FROM = REJECTION_NOTE_MAX_LENGTH - 50

const MODES = {
  reject: { reasons: REJECTION_REASONS, schema: rejectionSchema, action: rejectApplication },
  revoke: { reasons: REVOCATION_REASONS, schema: revocationSchema, action: revokeAcceptance },
} as const

type Errors = { reason?: string; note?: string; form?: string }

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

  function message(key: string, fragment?: string): string | undefined {
    const text = texts.errors[key]
    return fragment === undefined ? text : text?.replace('{fragment}', fragment)
  }

  async function confirm() {
    const input = { id, reason: reason ?? undefined, note }
    const issue = schema.safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      const { key, values } = toFieldError(issue)
      setErrors(
        issue.path[0] === 'reason'
          ? { reason: message(key) }
          : { note: message(key, values?.fragment) },
      )
      return
    }
    setErrors({})
    setBusy(true)
    const result = await action(input).catch(() => null)
    setBusy(false)
    if (result?.ok) {
      setOpen(false)
      router.push(doneHref)
      return
    }
    const key = result?.error ?? FAILED
    if (key !== FAILED) router.refresh()
    setErrors({ form: message(key) ?? message(FAILED) })
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
      <div className="flex w-full flex-col gap-4">
        <RadioGroup
          legend={texts.legend}
          name={`motivo-${id}`}
          options={reasons.map((value) => ({ value, label: texts.reasons[value] }))}
          value={reason ?? undefined}
          onChange={(value) => {
            setReason(reasons.find((known) => known === value) ?? null)
            setErrors({})
          }}
          error={errors.reason}
          disabled={busy}
          orientation="column"
        />
        {reason === 'other' ? (
          <div className="animate-[fade-in_var(--dur-base)_var(--ease-out)]">
            <CountedTextarea
              value={note}
              onChange={setNote}
              label={texts.noteLabel}
              error={errors.note}
              disabled={busy}
              max={REJECTION_NOTE_MAX_LENGTH}
              from={COUNTER_FROM}
              counts={texts.counts}
              rows={2}
            />
          </div>
        ) : null}
        <FormNote>{texts.private}</FormNote>
        {errors.form === undefined ? null : <ErrorText announce>{errors.form}</ErrorText>}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button variant="danger" loading={busy} onClick={() => void confirm()}>
            {texts.confirm}
          </Button>
          <SheetClose>
            <Button variant="ghost" disabled={busy}>
              {texts.cancel}
            </Button>
          </SheetClose>
        </div>
      </div>
    </Sheet>
  )
}
