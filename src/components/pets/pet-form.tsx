'use client'

import { useId, useState } from 'react'
import { usePetDraft } from '@/hooks/use-pet-draft'
import { usePetPhotos, type PetPhotoSlot } from '@/hooks/use-pet-photos'
import { useLeaveForm } from '@/hooks/use-leave-form'
import { deferredUntil } from '@/components/ui/deferred'
import type { Age, StoredAge } from '@/lib/pets/age'
import type { OwnQuestionSuggestion } from '@/lib/pets/own-question-suggestions'
import type { PetFormValues } from '@/lib/pets/types'
import type { PetField } from '@/lib/pets/fields'
import type { PetFormTexts } from './pet-form-types'
import { PetFieldsSlot } from './pet-fields-slot'
import { PetLeaveDialog } from './pet-leave-dialog'
import { PetPhotosField } from './pet-photos-field'

type Props = {
  texts: PetFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  initial: PetFormValues
  accountId: string
  /** La pantalla del formulario, para volver a ella después de entrar o de verificar. */
  returnTo: string
  /** Solo al editar: lo publicado y la edad que se mostró al abrir (research R7). */
  editing?: { petId: string; photos: PetPhotoSlot[]; ageBase: StoredAge; ageShown: Age }
  /**
   * Solo al publicar una cría sola como un animal (#205, FR-012): lo que ya se cargó, fotos
   * preparadas incluidas. Llega en `initial` y en `photos`, y lo escrito antes no lo pisa.
   */
  seedPhotos?: PetPhotoSlot[]
  ownQuestions: readonly OwnQuestionSuggestion[]
}

// Los campos, la tirita y lo que pasa al guardar (`PetFormBody`) llegan apenas abre la pantalla.
const loadBody = () => import('./pet-form-body')

// Lo recuperado se sabe después de abrir: nunca está en lo que dibuja el servidor (historia #304).
const DraftRestoredNote = deferredUntil(() =>
  import('./draft-restored-note').then((module) => module.DraftRestoredNote),
)

// La página es de ancho libre por la grilla de fotos (PetPhotosField) y los campos en dos columnas
// (PetFields); la nota de lo recuperado sigue en la medida de lectura.
const READING = 'max-w-[var(--measure)]'

// Publicar y editar son el mismo formulario y cambian el verbo (como `ProfileForm`). Al abrir salen
// las fotos y lo que tiene que estar desde el primer toque: lo escrito, las fotos que se preparan y
// el guardia de salir; los campos y el guardado llegan apenas abre, en `PetFormBody`, con cada error
// debajo de su campo y el de guardado arriba de la tirita, que es también el reintento (FR-021).
export function PetForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  accountId,
  returnTo,
  editing,
  seedPhotos,
  ownQuestions,
}: Props) {
  const base = useId()
  const idFor = (field: PetField | 'photos') => `${base}-${field}`
  const draft = usePetDraft(accountId, initial, editing === undefined, seedPhotos === undefined)
  const photos = usePetPhotos(editing?.photos ?? seedPhotos ?? [])
  const { values } = draft
  const photosError = useState<string | null>(null)
  const [error, setPhotosError] = photosError
  const [busy, setBusy] = useState(false)
  const hasPhotos = photos.list.slots.length > 0
  const dirty =
    editing === undefined
      ? hasPhotos
      : JSON.stringify(values) !== JSON.stringify(initial) ||
        photos.list.slots.map((slot) => slot.key).join() !==
          editing.photos.map((slot) => slot.key).join()
  const leaving = useLeaveForm(dirty)

  return (
    <div className="mt-6 flex flex-col gap-8">
      <PetLeaveDialog texts={texts.dialogs} dirty={dirty} leaving={leaving} />
      {draft.notice === null ? null : (
        <div className={READING}>
          <DraftRestoredNote
            when
            props={{ notice: draft.notice, texts: texts.draft, onStartOver: draft.startOver }}
          />
        </div>
      )}
      <PetPhotosField
        texts={texts.photos}
        list={photos.list}
        errors={texts.errors}
        error={error ?? undefined}
        inputId={idFor('photos')}
        disabled={busy}
        onPick={(files) => {
          draft.markStarted()
          setPhotosError(null)
          photos.pick(files)
        }}
        onMove={photos.move}
        onMakeCover={photos.makeCover}
        onRemove={photos.remove}
      />
      <PetFieldsSlot load={loadBody} failedTexts={texts.fieldsFailed}>
        {(body) => (
          <body.PetFormBody
            texts={texts}
            departments={departments}
            localitiesByDepartment={localitiesByDepartment}
            returnTo={returnTo}
            editing={editing}
            ownQuestions={ownQuestions}
            draft={draft}
            photos={photos}
            idFor={idFor}
            photosError={photosError}
            go={leaving.go}
            onBusyChange={setBusy}
          />
        )}
      </PetFieldsSlot>
    </div>
  )
}
