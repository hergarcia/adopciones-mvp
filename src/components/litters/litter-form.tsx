'use client'

import { useId, useState } from 'react'
import { PetFieldsSlot } from '@/components/pets/pet-fields-slot'
import { PetLeaveDialog } from '@/components/pets/pet-leave-dialog'
import { PetPhotosField } from '@/components/pets/pet-photos-field'
import { deferredUntil } from '@/components/ui/deferred'
import { useLeaveForm } from '@/hooks/use-leave-form'
import { useLitterDraft } from '@/hooks/use-litter-draft'
import { LITTER_PHOTOS, useLitterPhotos } from '@/hooks/use-litter-photos'
import type { PetPhotoSlot } from '@/hooks/use-pet-photos'
import type { LitterField, YoungField } from '@/lib/litters/fields'
import type { LitterEditing, LitterFormValues } from '@/lib/litters/types'
import type { OwnQuestionSuggestion } from '@/lib/pets/own-question-suggestions'
import type { PetFormValues } from '@/lib/pets/types'
import type { LitterFormTexts } from './litter-form-types'

// Lo común, las crías, el pie y el guardado (`LitterFormBody`) llegan apenas abre la pantalla, como
// los campos de un animal: con ellos al abrir, la camada pasaba los 150 KB (historia #338).
const loadBody = () => import('./litter-form-body')

// Lo recuperado se sabe después de abrir: nunca está en lo que dibuja el servidor.
const DraftRestoredNote = deferredUntil(() =>
  import('@/components/pets/draft-restored-note').then((module) => module.DraftRestoredNote),
)

type Props = {
  texts: LitterFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  /** Vacío, con la zona del perfil y las dos primeras crías (FR-007); al editar, lo publicado. */
  initial: LitterFormValues
  accountId: string
  returnTo: string
  /** El día de hoy en Uruguay, para la fecha de entrega (FR-013). */
  today: string
  ownQuestions: readonly OwnQuestionSuggestion[]
  /** Solo al publicar, «Publicarla como un animal» (FR-012): el formulario de un animal con lo cargado. */
  onSingleYoung?: (seed: { values: PetFormValues; photos: PetPhotoSlot[] }) => void
  /** Solo al editar: la camada y sus fotos publicadas, por grupo (FR-018). */
  editing?: LitterEditing & {
    photos: { litter: PetPhotoSlot[]; young: Record<string, PetPhotoSlot[]> }
  }
}

// Publicar o editar una camada: las fotos y lo común una vez, las crías con lo suyo y, al pie, para
// quién y desde cuándo (FR-004 a FR-020). Como `PetForm`, al abrir salen las fotos de la camada, lo
// escrito, las fotos que se preparan y el guardia de salir; lo demás llega en `LitterFormBody`.
export function LitterForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  accountId,
  returnTo,
  today,
  ownQuestions,
  onSingleYoung,
  editing,
}: Props) {
  const base = useId()
  const fieldId = (field: LitterField | 'photos') => `${base}-${field}`
  const youngId = (key: string, field: YoungField | 'photos') => `${base}-${key}-${field}`
  const draft = useLitterDraft(accountId, initial, editing === undefined)
  const published: Record<string, PetPhotoSlot[]> | undefined = editing && {
    ...editing.photos.young,
    [LITTER_PHOTOS]: editing.photos.litter,
  }
  const photos = useLitterPhotos(published)
  const { values } = draft
  const photosError = useState<string | null>(null)
  const [error, setPhotosError] = photosError
  const [busy, setBusy] = useState(false)
  // Empezar de nuevo vuelve a montar lo de abajo: se lleva los avisos de lo que estaba escrito.
  const [restarts, setRestarts] = useState(0)
  const hasPhotos = photos.submit.list.slots.length > 0
  // Al editar, salir avisa si algo cambió: lo escrito, las crías o las fotos de algún grupo.
  const groups = [LITTER_PHOTOS, ...values.young.map((one) => one.key)]
  const photoKeys = (slotsOf: (group: string) => { key: string }[]) =>
    JSON.stringify(groups.map((group) => slotsOf(group).map((slot) => slot.key)))
  const dirty =
    editing === undefined
      ? hasPhotos
      : JSON.stringify(values) !== JSON.stringify(initial) ||
        photoKeys((group) => photos.listOf(group).slots) !==
          photoKeys((group) => published?.[group] ?? [])
  const leaving = useLeaveForm(dirty)

  return (
    <div className="mt-6 flex flex-col gap-8">
      <PetLeaveDialog texts={texts.pet.dialogs} dirty={dirty} leaving={leaving} />
      {draft.notice === null ? null : (
        <div className="mb-2 max-w-[var(--measure)]">
          <DraftRestoredNote
            when
            props={{
              notice: draft.notice,
              texts: texts.pet.draft,
              onStartOver: () => {
                draft.startOver()
                setPhotosError(null)
                setRestarts((count) => count + 1)
              },
            }}
          />
        </div>
      )}
      <PetPhotosField
        texts={texts.pet.photos}
        list={photos.listOf(LITTER_PHOTOS)}
        errors={texts.pet.errors}
        error={error ?? undefined}
        inputId={fieldId('photos')}
        disabled={busy}
        onPick={(files) => {
          draft.markStarted()
          setPhotosError(null)
          photos.pick(LITTER_PHOTOS, files)
        }}
        onMove={(key, step) => photos.move(LITTER_PHOTOS, key, step)}
        onMakeCover={(key) => photos.makeCover(LITTER_PHOTOS, key)}
        onRemove={(key) => photos.remove(LITTER_PHOTOS, key)}
      />
      <PetFieldsSlot load={loadBody} failedTexts={texts.pet.fieldsFailed}>
        {(body) => (
          <body.LitterFormBody
            key={restarts}
            texts={texts}
            departments={departments}
            localitiesByDepartment={localitiesByDepartment}
            returnTo={returnTo}
            today={today}
            ownQuestions={ownQuestions}
            onSingleYoung={onSingleYoung}
            editing={editing}
            draft={draft}
            photos={photos}
            ids={{ field: fieldId, young: youngId, list: `${base}-young` }}
            photosError={photosError}
            hasPhotos={hasPhotos}
            go={leaving.go}
            onBusyChange={setBusy}
          />
        )}
      </PetFieldsSlot>
    </div>
  )
}
