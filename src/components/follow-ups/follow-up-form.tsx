'use client'

import { useId, useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import type { PlainPhotosTexts } from '@/components/pets/pet-form-types'
import { PetPhotosField } from '@/components/pets/pet-photos-field'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { useFollowUpSubmit } from '@/hooks/use-follow-up-submit'
import { usePetPhotos } from '@/hooks/use-pet-photos'
import type { PetStatusFailure } from '@/hooks/use-pet-status'
import { FOLLOW_UP_MAX_PHOTOS, FOLLOW_UP_TEXT_MAX } from '@/lib/follow-ups/rules'

export type FollowUpFormTexts = {
  /** «¿Cómo va Tobi?» */
  title: string
  /** «Rocío quiere saber cómo está. Mandale de 1 a 3 fotos.» */
  help: string
  photos: PlainPhotosTexts
  /** Por clave de error, en crudo: el motivo de cada foto que no entró. */
  photoErrors: Record<string, string>
  textLabel: string
  counts: { left: CountForms; over: CountForms }
  submit: string
  /** Lo que no llegó por la red: fotos y texto siguen en pantalla. */
  network: Record<PetStatusFailure, string>
  /** Por clave de `follow_ups.errors`, ya con el nombre del animal. */
  errors: Record<string, string>
  failed: string
}

type Props = { applicationId: string; texts: FollowUpFormTexts }

const COUNTER_FROM = FOLLOW_UP_TEXT_MAX - 100
const CLOSED = 'follow_ups.errors.closed'

// Contar cómo va (plan §Mi solicitud): de 1 a 3 fotos —la misma grilla de la ficha, sin portada ni
// orden— y un texto opcional. «Mandar» es la tirita; lo que no llegó por la red va en la tira de
// reintentar, con fotos y texto en pantalla (FR-014); un rechazo, en rojo arriba del botón. Con el
// pedido cerrado mientras tanto, lo dice y ya no se manda.
export function FollowUpForm({ applicationId, texts }: Props) {
  const inputId = useId()
  const photos = usePetPhotos([], FOLLOW_UP_MAX_PHOTOS)
  const [text, setText] = useState('')
  const flow = useFollowUpSubmit({ applicationId, photos })
  const failure = flow.failure
  const refused = failure?.kind === 'refused' ? failure.error : null
  const closed = refused === CLOSED

  return (
    <section aria-labelledby={`${inputId}-title`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={`${inputId}-title`} className="text-lg font-medium text-ink">
          {texts.title}
        </h2>
        <p className="text-sm text-ink-muted">{texts.help}</p>
      </div>
      <PetPhotosField
        variant="plain"
        max={FOLLOW_UP_MAX_PHOTOS}
        texts={texts.photos}
        list={photos.list}
        errors={texts.photoErrors}
        inputId={inputId}
        disabled={flow.busy || closed}
        onPick={photos.pick}
        onRemove={photos.remove}
      />
      <div className="max-w-[var(--measure)]">
        <CountedTextarea
          value={text}
          onChange={setText}
          label={texts.textLabel}
          error={undefined}
          disabled={flow.busy || closed}
          max={FOLLOW_UP_TEXT_MAX}
          maxLength={FOLLOW_UP_TEXT_MAX}
          from={COUNTER_FROM}
          counts={texts.counts}
          rows={4}
        />
      </div>
      {refused === null ? null : (
        <ErrorText announce>{texts.errors[refused] ?? texts.failed}</ErrorText>
      )}
      {failure === null || failure.kind === 'refused' ? null : (
        <SaveFailedStrip message={texts.network[failure.kind]} attempt={failure.attempt} />
      )}
      {closed ? null : (
        <div>
          <Button
            variant="tirita"
            size="lg"
            className="w-full md:w-auto"
            loading={flow.busy}
            onClick={() => flow.submit(text)}
          >
            {texts.submit}
          </Button>
        </div>
      )}
    </section>
  )
}
