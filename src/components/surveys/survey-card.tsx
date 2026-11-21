'use client'

import type { ActionResult } from '@/actions/result'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { SupportReply } from '@/components/support/support-whatsapp-link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorText } from '@/components/ui/error-text'
import { paperStrip } from '@/components/ui/paper-strip'
import { RadioGroup } from '@/components/ui/radio-group'
import { useSurveyAnswer } from '@/hooks/use-survey-answer'
import { cn } from '@/lib/cn'
import { SURVEY_COUNTER_FROM, SURVEY_TEXT_MAX, type SurveyMoment } from '@/lib/surveys/types'

export type SurveyCardTexts = {
  question: string
  options: { value: string; label: string }[]
  openQuestion: string
  anonymous: string
  send: string
  dismiss: string
  thanks: string
  /** Lo que se dice cuando el envío no llegó: lo elegido y lo escrito siguen ahí. */
  unsent: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `surveys.errors`; el de contacto, crudo con `{fragment}`. */
  errors: Record<string, string>
  /** «Si querés que te respondan, <link>escribinos por WhatsApp</link>.», crudo. */
  supportReply: string
}

type Action = (input: unknown) => Promise<ActionResult<null>>

type Props = {
  offerId: string
  moment: SurveyMoment
  texts: SurveyCardTexts
  answer: Action
  dismiss: Action
  /** El WhatsApp de soporte, o null sin número: entonces el error de contacto no lo ofrece. */
  supportUrl: string | null
  /**
   * El desenlace con el nombre del animal («Le encontraste hogar a Pancho»), donde la pantalla no
   * lo dice: en la pared de Mis animales. En Mi solicitud el desenlace ya está arriba.
   */
  title?: string
}

// La encuesta pegada al pie del desenlace (plan §Diseño La encuesta): una nota con cinta, sin
// inclinar porque se lee, con el desenlace en voz de afiche si la pantalla no lo dice, la pregunta
// del momento, sus tres opciones y la respuesta libre. Nunca un modal ni lo primero de la pantalla:
// «Enviar» es `secondary`. Lo elegido y lo escrito quedan ante cualquier error. Enviada, el
// agradecimiento ocupa su lugar; cerrada, desaparece.
export function SurveyCard({ offerId, moment, texts, answer, dismiss, supportUrl, title }: Props) {
  const survey = useSurveyAnswer({ offerId, moment, answer, dismiss, errorTexts: texts.errors })
  const { busy, errors, unsent, done } = survey

  if (done === 'dismissed') return null
  if (done === 'answered') {
    return (
      <output
        className={cn(
          paperStrip({ band: 'success' }),
          'animate-[fade-in_var(--dur-base)_var(--ease-out)]',
        )}
      >
        {texts.thanks}
      </output>
    )
  }

  const disabled = busy !== null
  return (
    <section aria-label={title ?? texts.question}>
      <Card taped className="flex flex-col gap-4 md:p-6">
        {title === undefined ? null : <h2 className="afiche text-xl text-ink">{title}</h2>}
        <RadioGroup
          legend={texts.question}
          legendSize="lg"
          name={`encuesta-${offerId}`}
          options={texts.options}
          value={survey.option}
          onChange={survey.setOption}
          error={errors.option}
          disabled={disabled}
        />
        <CountedTextarea
          value={survey.body}
          onChange={survey.setBody}
          label={texts.openQuestion}
          error={errors.body}
          disabled={disabled}
          max={SURVEY_TEXT_MAX}
          from={SURVEY_COUNTER_FROM}
          counts={texts.counts}
          rows={3}
        />
        {supportUrl !== null && survey.offersSupport ? (
          <p className="text-sm text-ink">
            <SupportReply href={supportUrl} template={texts.supportReply} />
          </p>
        ) : null}
        <p className="text-sm text-ink-muted">{texts.anonymous}</p>
        {errors.form === undefined ? null : <ErrorText announce>{errors.form}</ErrorText>}
        {unsent === 0 ? null : <SaveFailedStrip message={texts.unsent} attempt={unsent} />}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button
            variant="secondary"
            loading={busy === 'answer'}
            disabled={disabled}
            onClick={survey.send}
          >
            {texts.send}
          </Button>
          <Button
            variant="ghost"
            loading={busy === 'dismiss'}
            disabled={disabled}
            onClick={survey.dismiss}
          >
            {texts.dismiss}
          </Button>
        </div>
      </Card>
    </section>
  )
}
