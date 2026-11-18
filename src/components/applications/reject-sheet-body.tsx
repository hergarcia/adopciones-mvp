'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { rejectApplication, revokeAcceptance } from '@/actions/application-responses'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { RadioGroup } from '@/components/ui/radio-group'
import { SheetClose } from '@/components/ui/sheet'
import { afterOpenModule } from '@/hooks/use-after-open'
import { useResponseErrors } from '@/hooks/use-response-errors'
import {
  REJECTION_REASONS,
  REVOCATION_REASONS,
  type RevocationReason,
} from '@/lib/applications/rejection'
import { REJECTION_NOTE_MAX_LENGTH } from '@/lib/applications/rules'
import { toFieldError } from '@/lib/schemas/field-error'
import { FormNote } from './form-note'
import type { RejectSheetTexts } from './reject-sheet'

type Errors = { reason?: string; note?: string; form?: string }

// El contador aparece cuando faltan 50: antes no hace falta mirarlo.
const COUNTER_FROM = REJECTION_NOTE_MAX_LENGTH - 50

const FAILED = 'inbox.errors.failed'

const MODES = {
  reject: { reasons: REJECTION_REASONS, schema: 'rejectionSchema', action: rejectApplication },
  revoke: { reasons: REVOCATION_REASONS, schema: 'revocationSchema', action: revokeAcceptance },
} as const

// El schema llega después de abrir y lo espera el toque que llega antes (historia #304).
const loadSchemas = afterOpenModule(() => import('@/lib/schemas/application-response'))

type Props = {
  id: string
  mode: 'reject' | 'revoke'
  doneHref: string
  texts: RejectSheetTexts
  reason: RevocationReason | null
  onReason: (reason: RevocationReason | null) => void
  note: string
  onNote: (note: string) => void
  busy: boolean
  onBusy: (busy: boolean) => void
  close: () => void
}

// Lo de adentro de la hoja de rechazar, que llega después de abrir. Lo que falta o sobra se marca en
// su campo con el mismo schema que la acción; el motivo lo ve solo quien publicó, y la hoja lo dice
// antes de confirmar. Si la solicitud cambió mientras tanto, lo dice adentro y la pantalla de atrás
// se refresca con el estado real (FR-044).
export function RejectSheetBody({
  id,
  mode,
  doneHref,
  texts,
  reason,
  onReason,
  note,
  onNote,
  busy,
  onBusy,
  close,
}: Props) {
  const router = useRouter()
  const { reasons, schema, action } = MODES[mode]
  const [errors, setErrors] = useState<Errors>({})
  const { message, failure } = useResponseErrors(texts.errors, FAILED)

  async function confirm() {
    if (busy) return
    const input = { id, reason: reason ?? undefined, note }
    onBusy(true)
    const schemas = await loadSchemas().catch(() => null)
    if (schemas === null) {
      onBusy(false)
      setErrors({ form: failure(undefined) })
      return
    }
    const issue = schemas[schema].safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      onBusy(false)
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
    onBusy(false)
    if (result?.ok) {
      close()
      router.push(doneHref)
      return
    }
    setErrors({ form: failure(result?.error) })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <RadioGroup
        legend={texts.legend}
        name={`motivo-${id}`}
        options={reasons.map((value) => ({ value, label: texts.reasons[value] }))}
        value={reason ?? undefined}
        onChange={(value) => {
          onReason(reasons.find((known) => known === value) ?? null)
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
            onChange={onNote}
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
  )
}
