'use client'

import { useRef, useState } from 'react'
import type { FeedbackSent } from '@/actions/feedback'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { SupportReply } from '@/components/support/support-whatsapp-link'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { paperStrip } from '@/components/ui/paper-strip'
import { cn } from '@/lib/cn'
import { ensureFeedbackBrowser } from '@/lib/feedback/browser-cookie'
import { FEEDBACK_COUNTER_FROM, FEEDBACK_TEXT_MAX } from '@/lib/feedback/types'
import { fillFragment } from '@/lib/forms/fill-fragment'

export type FeedbackFormTexts = {
  label: string
  send: string
  sent: string
  back: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `feedback.errors`; el de contacto, crudo con `{fragment}`. */
  errors: Record<string, string>
  /** «Si querés que te respondan, <link>escribinos por WhatsApp</link>.», crudo. */
  supportReply: string
}

type Props = {
  /** La pantalla desde la que se llegó, o null: la acción decide qué guarda de ella. */
  from: string | null
  texts: FeedbackFormTexts
  send: (input: unknown) => Promise<FeedbackSent>
  /** El WhatsApp de soporte, o null sin número: entonces ningún error lo ofrece. */
  supportUrl: string | null
}

const FAILED = 'feedback.errors.failed'

// Los dos errores que dejan a la persona sin decir lo suyo por acá: el WhatsApp de soporte es la
// salida para que le respondan (FR-023, FR-024).
const OFFER_SUPPORT: ReadonlySet<string> = new Set([
  'feedback.errors.contact',
  'feedback.errors.limit',
])

// Opinar (plan §Diseño Opinar): una nota que se deja en el buzón del cartel, con «Enviar» como la
// tirita. Lo escrito queda ante cualquier error. Un intento por visita a la pantalla: el doble toque
// y el reintento después de un corte guardan una sola opinión (FR-025).
export function FeedbackForm({ from, texts, send, supportUrl }: Props) {
  const [body, setBody] = useState('')
  const [attemptId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ key: string; message: string }>()
  const [unsent, setUnsent] = useState(0)
  const [sent, setSent] = useState(false)
  const sendButton = useRef<HTMLButtonElement>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(undefined)
    setBusy(true)
    ensureFeedbackBrowser()
    const result = await send({ attemptId, body, path: from ?? '' }).catch(() => null)
    setBusy(false)
    if (result?.ok === true) {
      setUnsent(0)
      setSent(true)
      return
    }
    if (result === null) setUnsent((attempt) => attempt + 1)
    else {
      const template = texts.errors[result.error] ?? texts.errors[FAILED] ?? ''
      setError({ key: result.error, message: fillFragment(template, result.detail?.fragment) })
    }
    requestAnimationFrame(() => sendButton.current?.focus())
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4">
        <output
          className={cn(
            paperStrip({ band: 'success' }),
            'animate-[fade-in_var(--dur-base)_var(--ease-out)]',
          )}
        >
          {texts.sent}
        </output>
        {from === null ? null : (
          <LinkButton href={from} variant="ghost">
            {texts.back}
          </LinkButton>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <CountedTextarea
        value={body}
        onChange={setBody}
        label={texts.label}
        labelSize="lg"
        error={error?.message}
        disabled={busy}
        max={FEEDBACK_TEXT_MAX}
        from={FEEDBACK_COUNTER_FROM}
        counts={texts.counts}
        rows={6}
      />
      {supportUrl !== null && error !== undefined && OFFER_SUPPORT.has(error.key) ? (
        <p className="text-sm text-ink">
          <SupportReply href={supportUrl} template={texts.supportReply} />
        </p>
      ) : null}
      {unsent === 0 ? null : (
        <SaveFailedStrip message={texts.errors[FAILED] ?? ''} attempt={unsent} />
      )}
      <Button ref={sendButton} type="submit" variant="tirita" size="lg" loading={busy}>
        {texts.send}
      </Button>
    </form>
  )
}
