'use client'

import { useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose } from '@/components/ui/sheet'
import { useSuspend, type SuspendFailure, type SuspendOutcome } from '@/hooks/use-suspend'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { COUNTER_LEAD, SUSPENSION_REASON_MAX } from '@/lib/moderation/rules'
import { suspensionSchema } from '@/lib/schemas/suspension'

export type SuspendSheetTexts = {
  title: string
  consequencesLabel: string
  consequences: string[]
  reasonLabel: string
  note: string
  submit: string
  cancel: string
  close: string
  counts: { left: CountForms; over: CountForms }
  failures: Record<SuspendFailure, string>
  /** Por clave de `moderation.errors`. */
  errors: Record<string, string>
  /** Con `{name}` y `{date}` adentro, que la hoja reemplaza. */
  already: string
  alreadyDeleted: string
  locale: string
}

type Props = {
  publicId: string
  /** El reporte desde el que se suspende, o nulo desde el perfil. */
  reportId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ya guardada: el nombre, para el aviso. */
  onDone: (name: string) => void
  /** La base dijo que ya no se puede (la cuenta no existe, o ya no administra). */
  onRefused: (key: string) => void
  texts: SuspendSheetTexts
}

function alreadyText(
  outcome: Extract<SuspendOutcome, { kind: 'already' }>,
  texts: SuspendSheetTexts,
) {
  const date = outcome.detail === null ? '' : momentDayLabel(outcome.detail.since, texts.locale)
  const by = outcome.detail?.by ?? null
  return (by === null ? texts.alreadyDeleted : texts.already.replace('{name}', by)).replace(
    '{date}',
    date,
  )
}

// Suspender a una persona (plan §Suspender): qué va a pasar, el motivo con cuánto queda y que ella
// lo va a leer tal cual. El motivo se valida con el mismo schema que la acción; lo escrito queda
// si no llega. El `danger` de la pantalla está acá, en el botón que confirma.
export function SuspendSheet({
  publicId,
  reportId,
  open,
  onOpenChange,
  onDone,
  onRefused,
  texts,
}: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [settled, setSettled] = useState<string | null>(null)
  const flow = useSuspend({ publicId, reportId })

  async function submit() {
    const parsed = suspensionSchema.safeParse({ publicId, reason })
    const issue = parsed.error?.issues[0]
    if (issue !== undefined) {
      setError(texts.errors[issue.message] ?? null)
      return
    }
    setError(null)
    const outcome = await flow.send(reason)
    if (outcome === null) return
    if (outcome.kind === 'done') onDone(outcome.name)
    else if (outcome.kind === 'field') setError(texts.errors[outcome.key] ?? null)
    else if (outcome.kind === 'already') setSettled(alreadyText(outcome, texts))
    else if (outcome.key === 'moderation.errors.self') setSettled(texts.errors[outcome.key] ?? '')
    else onRefused(outcome.key)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (flow.busy ? undefined : onOpenChange(next))}
      title={texts.title}
      closeLabel={texts.close}
    >
      <div className="flex w-full flex-col gap-4">
        <ul aria-label={texts.consequencesLabel} className="list-disc pl-5 text-sm text-ink">
          {texts.consequences.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <CountedTextarea
          value={reason}
          onChange={setReason}
          label={texts.reasonLabel}
          error={error ?? undefined}
          disabled={flow.busy || settled !== null}
          max={SUSPENSION_REASON_MAX}
          from={SUSPENSION_REASON_MAX - COUNTER_LEAD}
          counts={texts.counts}
        />
        <p className="text-sm text-ink-muted">{texts.note}</p>
        {flow.failure === null ? null : (
          <SaveFailedStrip
            message={texts.failures[flow.failure.kind]}
            attempt={flow.failure.attempt}
          />
        )}
        {settled === null ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button variant="danger" loading={flow.busy} onClick={() => void submit()}>
              {texts.submit}
            </Button>
            <SheetClose>
              <Button variant="ghost" disabled={flow.busy}>
                {texts.cancel}
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <output className="text-base text-ink">{settled}</output>
            <SheetClose>
              <Button variant="ghost" className="self-start">
                {texts.close}
              </Button>
            </SheetClose>
          </>
        )}
      </div>
    </Sheet>
  )
}
