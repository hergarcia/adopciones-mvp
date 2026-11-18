'use client'

import { CountedTextarea } from '@/components/forms/counted-textarea'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { RadioGroup } from '@/components/ui/radio-group'
import { SheetClose } from '@/components/ui/sheet'
import type { RevocationReason } from '@/lib/applications/rejection'
import { REJECTION_NOTE_MAX_LENGTH } from '@/lib/applications/rules'
import { FormNote } from './form-note'
import type { RejectSheetTexts } from './reject-sheet'

export type RejectErrors = { reason?: string; note?: string; form?: string }

// El contador aparece cuando faltan 50: antes no hace falta mirarlo.
const COUNTER_FROM = REJECTION_NOTE_MAX_LENGTH - 50

type Props = {
  id: string
  reasons: readonly RevocationReason[]
  reason: RevocationReason | null
  onReason: (reason: RevocationReason | null) => void
  note: string
  onNote: (note: string) => void
  errors: RejectErrors
  busy: boolean
  onConfirm: () => void
  texts: RejectSheetTexts
}

// Lo de adentro de la hoja de rechazar: llega después de abrir (`deferred`).
export function RejectSheetBody({
  id,
  reasons,
  reason,
  onReason,
  note,
  onNote,
  errors,
  busy,
  onConfirm,
  texts,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      <RadioGroup
        legend={texts.legend}
        name={`motivo-${id}`}
        options={reasons.map((value) => ({ value, label: texts.reasons[value] }))}
        value={reason ?? undefined}
        onChange={(value) => onReason(reasons.find((known) => known === value) ?? null)}
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
        <Button variant="danger" loading={busy} onClick={onConfirm}>
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
