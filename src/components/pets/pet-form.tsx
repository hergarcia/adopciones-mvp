'use client'

import { useId, useState } from 'react'
import { publishPet, savePet, trackPetMoment } from '@/actions/pets'
import { usePetDraft } from '@/hooks/use-pet-draft'
import { usePetPhotos, type PetPhotoSlot } from '@/hooks/use-pet-photos'
import { usePetFeedback } from '@/hooks/use-pet-feedback'
import { usePetSubmit } from '@/hooks/use-pet-submit'
import { useLeaveForm } from '@/hooks/use-leave-form'
import { fillFragment } from '@/lib/forms/fill-fragment'
import type { Age, StoredAge } from '@/lib/pets/age'
import { editExtras, petFormData } from '@/lib/pets/form-data'
import { withPetNotice } from '@/lib/pets/notice'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { PetFormValues } from '@/lib/pets/types'
import {
  PET_FIELDS,
  contactRejections,
  validatePet,
  type PetField,
  type PetFieldErrors,
} from '@/lib/schemas/pet'
import { DraftRestoredNote } from './draft-restored-note'
import { PetFormDialogs } from './pet-form-dialogs'
import type { PetFormTexts } from './pet-form-types'
import { PetFields } from './pet-fields'
import { PetPhotosField } from './pet-photos-field'
import { PetSaveFooter } from './pet-save-footer'

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
}

// La página es de ancho libre por la grilla de fotos (PetPhotosField) y los campos en dos columnas
// (PetFields); la nota de lo recuperado sigue en la medida de lectura.
const READING = 'max-w-[var(--measure)]'

// Publicar y editar son el mismo formulario y cambian el verbo (como `ProfileForm`): coordina las
// fotos, los campos, lo escrito y el guardado, con cada error debajo de su campo y el de guardado
// arriba de la tirita, que es también el reintento (FR-021).
//
// Pasa de 150 líneas a propósito: lo que tiene lógica ya vive en los hooks (fotos, lo escrito, el
// guardado, lo que responde, el guardia) y en componentes con nombre; lo que queda es el cableado
// entre ellos, y partirlo esconde el recorrido de una publicación en cuatro archivos más.
export function PetForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  accountId,
  returnTo,
  editing,
}: Props) {
  const base = useId()
  const idFor = (field: PetField | 'photos') => `${base}-${field}`
  const draft = usePetDraft(accountId, initial, editing === undefined)
  const photos = usePetPhotos(editing?.photos ?? [])
  const { values } = draft
  const [fieldErrors, setFieldErrors] = useState<PetFieldErrors>({})
  const feedback = usePetFeedback({
    texts: {
      offline: texts.offline,
      site: texts.site,
      photosBlocked: texts.errors['pets.errors.photos_blocked'] ?? '',
      photosRequired: texts.errors['pets.errors.photos_required'] ?? '',
    },
    returnTo,
    onSaved: () => {
      if (editing === undefined) draft.finish()
      go(withPetNotice(editing === undefined ? 'published' : 'edited'))
    },
    onFieldErrors: (errors) => {
      setFieldErrors(errors)
      focusFirst(errors, false)
    },
  })

  const ageUnchanged =
    editing !== undefined &&
    values.ageValue.trim() === String(editing.ageShown.value) &&
    values.ageUnit === editing.ageShown.unit

  function focusFirst(errors: PetFieldErrors, photosMissing: boolean) {
    const first = photosMissing ? 'photos' : PET_FIELDS.find((field) => errors[field] !== undefined)
    const target = first === undefined ? null : document.getElementById(idFor(first))
    const control = target?.matches('input, textarea, button')
      ? target
      : target?.querySelector('input')
    control?.focus()
  }

  const submitter = usePetSubmit({ photos, returnTo, onOutcome: feedback.apply })
  const hasPhotos = photos.list.slots.length > 0
  const dirty =
    editing === undefined
      ? hasPhotos
      : JSON.stringify(values) !== JSON.stringify(initial) ||
        photos.list.slots.map((slot) => slot.key).join() !==
          editing.photos.map((slot) => slot.key).join()
  const { leavingTo, leave, stay, go } = useLeaveForm(dirty)

  function change<K extends keyof PetFormValues>(key: K, value: PetFormValues[K]) {
    draft.markStarted()
    draft.setValues((current) => ({ ...current, [key]: value }))
  }

  function send(confirmDuplicate: boolean) {
    feedback.clear()
    submitter.submit((photoIds) => {
      const common = { photoIds: JSON.stringify(photoIds), returnTo }
      if (editing === undefined) {
        return publishPet(
          petFormData(values, {
            ...common,
            attemptId: draft.attemptId(),
            startedAt: String(draft.startedAt() ?? Date.now()),
            confirmDuplicate: String(confirmDuplicate),
          }),
        )
      }
      return savePet(petFormData(values, { ...common, ...editExtras(editing) }))
    })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const checked = validatePet(values, { ageUnchanged })
    const errors = checked.ok ? {} : checked.errors
    const photosMissing = !hasPhotos
    setFieldErrors(errors)
    feedback.setPhotosError(
      photosMissing ? (texts.errors['pets.errors.photos_required'] ?? null) : null,
    )
    if (!checked.ok || photosMissing) {
      for (const rejected of contactRejections(errors))
        void trackPetMoment('pet_contact_rejected', rejected)
      focusFirst(errors, photosMissing)
      return
    }
    send(false)
  }

  const errorFor = (field: PetField) => {
    const found = fieldErrors[field]
    return found === undefined
      ? undefined
      : fillFragment(texts.errors[found.key] ?? found.key, found.values?.fragment)
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-8">
        {draft.notice === null ? null : (
          <div className={READING}>
            <DraftRestoredNote
              notice={draft.notice}
              texts={texts.draft}
              onStartOver={draft.startOver}
            />
          </div>
        )}
        <PetPhotosField
          texts={texts.photos}
          list={photos.list}
          errors={texts.errors}
          error={feedback.photosError ?? undefined}
          inputId={idFor('photos')}
          disabled={submitter.busy}
          onPick={(files) => {
            draft.markStarted()
            feedback.setPhotosError(null)
            photos.pick(files)
          }}
          onMove={photos.move}
          onMakeCover={photos.makeCover}
          onRemove={photos.remove}
        />
        <PetFields
          texts={texts.fields}
          values={values}
          departments={departments}
          localities={localitiesByDepartment[values.department] ?? []}
          errorFor={errorFor}
          idFor={idFor}
          onChange={change}
          footer={
            <PetSaveFooter
              texts={texts}
              busy={submitter.busy}
              progress={submitter.progress}
              error={feedback.error}
              changedElsewhere={feedback.changedElsewhere}
              onReopen={() => go(returnTo, true)}
            />
          }
        />
      </form>

      <PetFormDialogs
        texts={texts.dialogs}
        leaving={leavingTo !== null}
        duplicate={feedback.duplicate}
        blocked={feedback.blocked}
        hasPhotos={hasPhotos}
        busy={submitter.busy}
        onStay={stay}
        onLeave={leave}
        onPublishAnyway={() => send(true)}
        onBackToMyPets={() => go(MY_PETS_PATH)}
        onCloseDuplicate={feedback.closeDuplicate}
        onUnblock={() =>
          go(
            feedback.blocked?.kind === 'level'
              ? feedback.blocked.gatePath
              : `/entrar?next=${encodeURIComponent(returnTo)}`,
          )
        }
        onCloseBlocked={feedback.closeBlocked}
      />
    </>
  )
}
