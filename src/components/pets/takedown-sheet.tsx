'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { TAKEDOWN_NOTE_MAX } from '@/lib/pets/rules'
import { TAKEDOWN_REASONS, type TakedownReason } from '@/lib/pets/types'
import { petReviewResolutionSchema } from '@/lib/schemas/pet-review'
import { CharacterCount } from '@/components/forms/character-count'
import type { CountForms } from './pet-form-types'

export type TakedownSheetTexts = {
  trigger: string
  title: string
  legend: string
  reasons: Record<TakedownReason, string>
  noteLabel: string
  reads: string
  confirm: string
  close: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `pet_review.errors`. */
  errors: Record<string, string>
}

type Props = {
  petId: string
  knownSince: string
  open: boolean
  onOpenChange: (open: boolean) => void
  busy: boolean
  disabled: boolean
  /** Lo que no llegó o no se aplicó, dentro de la hoja: nombra «Dar de baja», que se vuelve a tocar. */
  feedback: React.ReactNode
  onConfirm: (reason: TakedownReason, note: string) => void
  texts: TakedownSheetTexts
}

// El contador aparece cuando faltan 50 para el tope: antes no hace falta mirarlo.
const COUNTER_FROM = TAKEDOWN_NOTE_MAX - 50

// Dar de baja pide el motivo de la lista y, para «otro», el texto que el publicador va a leer tal
// cual (FR-025); la hoja lo dice antes de confirmar. Lo que falta se dice en su campo y nada cambia
// (US4-AS9): el schema es el mismo que valida la acción.
export function TakedownSheet({
  petId,
  knownSince,
  open,
  onOpenChange,
  busy,
  disabled,
  feedback,
  onConfirm,
  texts,
}: Props) {
  const noteId = useId()
  const countId = useId()
  const [reason, setReason] = useState<TakedownReason | null>(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ reason?: string; note?: string }>({})

  function confirm() {
    if (reason === null) {
      setErrors({ reason: texts.errors['pet_review.errors.reason_required'] })
      return
    }
    const parsed = petReviewResolutionSchema.safeParse({
      petId,
      knownSince,
      outcome: 'taken_down',
      reason,
      note,
    })
    const issue = parsed.error?.issues.find((found) => found.path[0] === 'note')
    if (issue !== undefined) {
      setErrors({ note: texts.errors[issue.message] })
      return
    }
    setErrors({})
    onConfirm(reason, note)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="ghost-danger" disabled={disabled}>
          {texts.trigger}
        </Button>
      }
    >
      <div className="flex w-full flex-col gap-6">
        <RadioGroup
          legend={texts.legend}
          name={`motivo-${petId}`}
          options={TAKEDOWN_REASONS.map((value) => ({ value, label: texts.reasons[value] }))}
          value={reason ?? undefined}
          onChange={(value) => {
            setReason(TAKEDOWN_REASONS.find((known) => known === value) ?? null)
            setErrors({})
          }}
          error={errors.reason}
          disabled={busy}
        />
        {reason === 'other' ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={noteId} className="text-sm text-ink-muted">
              {texts.noteLabel}
            </label>
            <Textarea
              id={noteId}
              rows={4}
              value={note}
              error={errors.note}
              aria-describedby={countId}
              disabled={busy}
              onChange={(event) => setNote(event.target.value)}
            />
            <CharacterCount
              id={countId}
              value={note}
              max={TAKEDOWN_NOTE_MAX}
              from={COUNTER_FROM}
              texts={texts.counts}
            />
          </div>
        ) : null}
        <p className="text-sm text-ink">{texts.reads}</p>
        {feedback}
        <Button variant="danger" className="self-start" loading={busy} onClick={confirm}>
          {texts.confirm}
        </Button>
      </div>
    </Sheet>
  )
}
