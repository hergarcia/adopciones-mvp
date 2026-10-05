'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { RadioGroup } from '@/components/ui/radio-group'
import { Sheet, SheetClose } from '@/components/ui/sheet'
import { useReport, type ReportFailure } from '@/hooks/use-report'
import { signInWithNext } from '@/lib/auth/next-destination'
import { BLOCK_FLAG, REPORT_FLAG, withFlag } from '@/lib/moderation/paths'
import { REPORT_REASONS, type ReportReason } from '@/lib/moderation/types'
import { reportSchema } from '@/lib/schemas/report'
import { AnonymityNote } from './anonymity-note'
import { ReportDetailsField } from './report-details-field'
import { ReportSent } from './report-sent'

export type ReportSheetTexts = {
  title: string
  legend: string
  reasons: Record<ReportReason, string>
  detailsLabel: string
  detailsLabelRequired: string
  counts: { left: CountForms; over: CountForms }
  anonymity: string
  submit: string
  cancel: string
  close: string
  sentTitle: string
  sentBody: string
  blockOffer: string
  back: string
  failures: Record<ReportFailure, string>
  /** Por clave de `moderation.errors`. */
  errors: Record<string, string>
}

type Props = {
  publicId: string
  /** El perfil, al que se vuelve; con la marca, para volver de ingresar con la hoja abierta. */
  profilePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  texts: ReportSheetTexts
}

// Reportar a una persona (plan §Reportar): el motivo, el texto con cuánto queda, y que es anónimo.
// Lo que falta se dice en su campo con el mismo schema que la acción, y lo elegido queda; al llegar,
// la misma hoja confirma y ofrece bloquear, si no estaba bloqueada (FR-005).
export function ReportSheet({ publicId, profilePath, open, onOpenChange, texts }: Props) {
  const router = useRouter()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<{ reason?: string; details?: string }>({})
  const flow = useReport(publicId)

  async function submit() {
    const parsed = reportSchema.safeParse({ publicId, reason: reason ?? undefined, details })
    const issue = parsed.error?.issues[0]
    if (issue !== undefined) {
      const field = issue.path[0] === 'details' ? 'details' : 'reason'
      setErrors({ [field]: texts.errors[issue.message] })
      return
    }
    setErrors({})
    const refusal = await flow.send({ reason: reason ?? 'other', details })
    if (refusal === null) return
    if (refusal.kind === 'field') {
      setErrors({ [refusal.field]: texts.errors[refusal.key] })
    } else if (refusal.kind === 'gone') {
      onOpenChange(false)
      router.refresh()
    } else {
      router.push(signInWithNext(withFlag(profilePath, REPORT_FLAG)))
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (flow.busy ? undefined : onOpenChange(next))}
      title={flow.sent === null ? texts.title : texts.sentTitle}
      closeLabel={texts.close}
    >
      {flow.sent === null ? (
        <div className="flex w-full flex-col gap-4">
          <RadioGroup
            legend={texts.legend}
            name={`motivo-${publicId}`}
            options={REPORT_REASONS.map((value) => ({ value, label: texts.reasons[value] }))}
            value={reason ?? undefined}
            onChange={(value) => {
              setReason(REPORT_REASONS.find((known) => known === value) ?? null)
              setErrors({})
            }}
            error={errors.reason}
            disabled={flow.busy}
          />
          <ReportDetailsField
            value={details}
            onChange={setDetails}
            label={reason === 'other' ? texts.detailsLabelRequired : texts.detailsLabel}
            error={errors.details}
            disabled={flow.busy}
            counts={texts.counts}
          />
          <AnonymityNote text={texts.anonymity} />
          {flow.failure === null ? null : (
            <SaveFailedStrip
              message={texts.failures[flow.failure.kind]}
              attempt={flow.failure.attempt}
            />
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button loading={flow.busy} onClick={() => void submit()}>
              {texts.submit}
            </Button>
            <SheetClose>
              <Button variant="ghost" disabled={flow.busy}>
                {texts.cancel}
              </Button>
            </SheetClose>
          </div>
        </div>
      ) : (
        <ReportSent
          body={texts.sentBody}
          blockOffer={
            flow.sent.blockedAlready ? null : (
              <LinkButton href={withFlag(profilePath, BLOCK_FLAG)} variant="secondary">
                {texts.blockOffer}
              </LinkButton>
            )
          }
          back={
            <SheetClose>
              <Button variant="ghost">{texts.back}</Button>
            </SheetClose>
          }
        />
      )}
    </Sheet>
  )
}
