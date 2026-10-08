'use client'

import { FormNote } from '@/components/applications/form-note'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { LinkButton } from '@/components/ui/link-button'
import { RadioGroup } from '@/components/ui/radio-group'
import { TextLink } from '@/components/ui/text-link'
import { OUTSIDE, useHandover, type HandoverRefusal } from '@/hooks/use-handover'
import type { PetStatusFailure } from '@/hooks/use-pet-status'
import { CommitmentText } from './commitment-text'

/** Lo que se lee al elegir a una persona, ya traducido con su nombre. */
export type HandoverChoiceTexts = {
  clauses: string[]
  note: string
  confirm: string
  /** Lo que no llegó, nombrando el botón que se tocó. */
  failures: Record<PetStatusFailure, string>
  /** Por qué ya no se la puede elegir: «Ana ya no sigue con esta solicitud». */
  refusals: Record<HandoverRefusal, string>
}

export type HandoverOption = {
  applicationId: string
  /** El renglón de la persona, armado en el servidor (`HandoverCandidate`). */
  label: React.ReactNode
  texts: HandoverChoiceTexts
}

type Props = {
  petId: string
  /** A donde se vuelve: Mis animales o la pantalla del animal. */
  back: string
  /** Esta pantalla, para volver a ella después de ingresar. */
  self: string
  options: HandoverOption[]
  /** Ya traducidos. `empty`, la nota y el camino a las solicitudes cuando no hay aceptadas. */
  texts: {
    legend: string
    outside: string
    outsideNote: string
    commitmentTitle: string
    outsideConfirm: string
    outsideFailures: Record<PetStatusFailure, string>
    cancel: string
    empty: { note: string; link: string; href: string } | null
  }
}

// «¿A quién se lo diste?» (plan §Marcar adoptado): las aceptadas y «por fuera del sitio», para
// elegir una sola; sin elegir no hay botón (FR-001). Al elegir a una persona, debajo, el compromiso
// con los tres nombres y la tirita que lo acepta y marca en el mismo paso (FR-003); por fuera, la
// nota de que no queda nada y «Marcar adoptado».
export function HandoverForm({ petId, back, self, options, texts }: Props) {
  const flow = useHandover({ petId, back, self })
  const chosen = options.find((option) => option.applicationId === flow.choice) ?? null
  const refused = options.find((option) => option.applicationId === flow.refusal?.candidate)
  const outside = flow.choice === OUTSIDE
  const failures = chosen?.texts.failures ?? texts.outsideFailures

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {flow.refusal !== null && refused !== undefined ? (
          <ErrorText announce>{refused.texts.refusals[flow.refusal.kind]}</ErrorText>
        ) : null}
        <RadioGroup
          legend={texts.legend}
          name="handover"
          orientation="column"
          value={flow.choice ?? ''}
          onChange={flow.choose}
          disabled={flow.busy}
          options={[
            ...options.map((option) => ({ value: option.applicationId, label: option.label })),
            { value: OUTSIDE, label: texts.outside },
          ]}
        />
        {texts.empty === null ? null : (
          <FormNote>
            {texts.empty.note}{' '}
            <TextLink href={texts.empty.href} prefetch={false}>
              {texts.empty.link}
            </TextLink>
          </FormNote>
        )}
      </div>

      {chosen === null && !outside ? null : (
        <div className="flex animate-[fade-in_var(--dur-base)_var(--ease-out)] flex-col gap-4 motion-reduce:animate-none">
          {chosen === null ? (
            <FormNote>{texts.outsideNote}</FormNote>
          ) : (
            <>
              <h2 className="text-lg font-medium text-ink">{texts.commitmentTitle}</h2>
              <CommitmentText clauses={chosen.texts.clauses} note={chosen.texts.note} />
            </>
          )}
          {flow.failure === null ? null : (
            <SaveFailedStrip message={failures[flow.failure.kind]} attempt={flow.failure.attempt} />
          )}
          <div className="flex flex-col items-start gap-3">
            <Button
              variant={chosen === null ? 'secondary' : 'tirita'}
              size={chosen === null ? 'md' : 'lg'}
              className={chosen === null ? undefined : 'w-full md:w-auto'}
              loading={flow.busy}
              onClick={() => void flow.confirm()}
            >
              {chosen === null ? texts.outsideConfirm : chosen.texts.confirm}
            </Button>
            <LinkButton href={back} variant="ghost">
              {texts.cancel}
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  )
}
