'use client'

import { useRef, useState } from 'react'
import type { FeedbackSent } from '@/actions/feedback'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
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
}

type Props = {
  /** La pantalla desde la que se llegó, o null: la acción decide qué guarda de ella. */
  from: string | null
  texts: FeedbackFormTexts
  send: (input: unknown) => Promise<FeedbackSent>
}

const FAILED = 'feedback.errors.failed'

// Opinar (plan §Diseño Opinar): una nota que se deja en el buzón del cartel, con «Enviar» como la
// tirita. Lo escrito queda ante cualquier error. Un intento por visita a la pantalla: el doble toque
// y el reintento después de un corte guardan una sola opinión (FR-025).
export function FeedbackForm({ from, texts, send }: Props) {
  const [body, setBody] = useState('')
  const [attemptId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
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
      setError(fillFragment(template, result.detail?.fragment))
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
        error={error}
        disabled={busy}
        max={FEEDBACK_TEXT_MAX}
        from={FEEDBACK_COUNTER_FROM}
        counts={texts.counts}
        rows={6}
      />
      {unsent === 0 ? null : (
        <SaveFailedStrip message={texts.errors[FAILED] ?? ''} attempt={unsent} />
      )}
      <Button ref={sendButton} type="submit" variant="tirita" size="lg" loading={busy}>
        {texts.send}
      </Button>
    </form>
  )
}
