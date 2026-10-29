'use client'

import { useEffect, useId } from 'react'
import type { ActionResult } from '@/actions/result'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { SingleTaskColumns } from '@/components/forms/single-task-columns'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { ErrorText } from '@/components/ui/error-text'
import { useExitAnswer } from '@/hooks/use-exit-answer'
import { countCharacters } from '@/lib/pets/char-count'
import { EXIT_COUNTER_FROM, EXIT_TEXT_MAX, type ExitLevel } from '@/lib/verification/exit-question'
import { VerifyHeading } from './verify-heading'

export type ExitQuestionTexts = {
  question: string
  lead: string
  /** Las opciones que se mandan con un toque, sin «Otra cosa». */
  options: { value: string; label: string }[]
  other: string
  otherLabel: string
  send: string
  skip: string
  /** Lo que se dice cuando una opción no llegó por la conexión. */
  unsent: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `verification.exit.errors`; el de contacto, crudo con `{fragment}`. */
  errors: Record<string, string>
}

type Action = (input: unknown) => Promise<ActionResult<null>>

type Props = {
  level: ExitLevel
  texts: ExitQuestionTexts
  /** A donde llevaba «Ahora no» antes de la pregunta: ahí va al contestar o al seguir. */
  destination: string
  answer: Action
  skip: Action
}

const OTHER = 'other'

// «¿Qué te frena?» en el lugar del formulario que se deja (plan §Diseño). Las opciones pesan igual
// a propósito: una destacada empujaría la respuesta y la medición dejaría de decir qué frena. La
// pregunta nunca le suma más de un toque a quien se quiere ir.
export function ExitQuestion({ level, texts, destination, answer, skip }: Props) {
  const headingId = useId()
  const exit = useExitAnswer({ level, destination, answer, skip, errorTexts: texts.errors })
  const { busy, chosen, disabled } = exit
  const over = countCharacters(exit.body.trim()) > EXIT_TEXT_MAX

  // La pantalla cambió sin navegar: el foco al título hace que un lector de pantalla lo anuncie.
  useEffect(() => {
    document.getElementById(headingId)?.focus()
  }, [headingId])

  return (
    <section aria-labelledby={headingId}>
      <SingleTaskColumns
        presentation={
          <VerifyHeading
            id={headingId}
            focusable
            texts={{ title: texts.question, lead: texts.lead }}
          />
        }
        task={
          <div className="mt-8 flex flex-col">
            <ul aria-labelledby={headingId} className="flex flex-col gap-3">
              {texts.options.map(({ value, label }) => {
                const sending = busy?.kind === 'option' && busy.option === value
                return (
                  <li key={value}>
                    <Button
                      variant={chosen === value ? 'primary' : 'secondary'}
                      align="start"
                      aria-pressed={chosen === value}
                      loading={sending}
                      disabled={disabled && !sending}
                      onClick={() => exit.send(value)}
                      className="w-full py-2"
                    >
                      {label}
                    </Button>
                  </li>
                )
              })}
              <li>
                <Disclosure label={texts.other} variant="option">
                  <div className="mt-3 flex flex-col gap-3">
                    <CountedTextarea
                      value={exit.body}
                      onChange={exit.setBody}
                      label={texts.otherLabel}
                      error={exit.errors.body}
                      disabled={disabled}
                      max={EXIT_TEXT_MAX}
                      from={EXIT_COUNTER_FROM}
                      counts={texts.counts}
                      rows={3}
                    />
                    <Button
                      variant={chosen === OTHER ? 'primary' : 'secondary'}
                      aria-pressed={chosen === OTHER}
                      loading={busy?.kind === 'other'}
                      disabled={(disabled && busy?.kind !== 'other') || over}
                      onClick={() => exit.send(OTHER, true)}
                      className="self-start"
                    >
                      {texts.send}
                    </Button>
                  </div>
                </Disclosure>
              </li>
            </ul>
            {exit.errors.form === undefined ? null : (
              <div className="mt-6">
                <ErrorText announce>{exit.errors.form}</ErrorText>
              </div>
            )}
            {exit.unsent === 0 ? null : (
              <div className="mt-6">
                <SaveFailedStrip message={texts.unsent} attempt={exit.unsent} />
              </div>
            )}
            <Button
              variant="ghost"
              loading={busy?.kind === 'skip'}
              disabled={disabled && busy?.kind !== 'skip'}
              onClick={exit.goOn}
              className="mt-8 self-start"
            >
              {texts.skip}
            </Button>
          </div>
        }
      />
    </section>
  )
}
