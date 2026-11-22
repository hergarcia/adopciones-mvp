'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { publishPet, savePet, trackPetMoment } from '@/actions/pets'
import { deferredUntil } from '@/components/ui/deferred'
import { afterOpenModule } from '@/hooks/use-after-open'
import type { usePetDraft } from '@/hooks/use-pet-draft'
import { usePetFeedback } from '@/hooks/use-pet-feedback'
import type { PetPhotoSlot, usePetPhotos } from '@/hooks/use-pet-photos'
import { usePetSubmit } from '@/hooks/use-pet-submit'
import { fillFragment } from '@/lib/forms/fill-fragment'
import { withoutFieldError } from '@/lib/forms/without-field-error'
import type { Age, StoredAge } from '@/lib/pets/age'
import { PET_FIELDS, type PetField } from '@/lib/pets/fields'
import { editExtras, petFormData } from '@/lib/pets/form-data'
import { withPetNotice } from '@/lib/pets/notice'
import type { OwnQuestionSuggestion } from '@/lib/pets/own-question-suggestions'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { PetFormValues } from '@/lib/pets/types'
import type { PetFieldErrors } from '@/lib/schemas/pet'
import { petDuplicateTitle } from './pet-duplicate-title'
import { PetFields } from './pet-fields'
import type { PetFormTexts } from './pet-form-types'
import { PetSaveFooter } from './pet-save-footer'

type Props = {
  texts: PetFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  returnTo: string
  editing?: { petId: string; photos: PetPhotoSlot[]; ageBase: StoredAge; ageShown: Age }
  ownQuestions: readonly OwnQuestionSuggestion[]
  draft: ReturnType<typeof usePetDraft>
  photos: ReturnType<typeof usePetPhotos>
  idFor: (field: PetField | 'photos') => string
  photosError: [string | null, Dispatch<SetStateAction<string | null>>]
  /** Las salidas elegidas de `useLeaveForm`: publicó, guardó o eligió irse desde un aviso. */
  go: (url: string, hard?: boolean) => void
  onBusyChange: (busy: boolean) => void
}

// El schema trae zod, 23 KB: llega después de abrir y lo espera el «Publicar» que llega antes
// (historia #304).
const loadPetRules = afterOpenModule(() => import('@/lib/schemas/pet'))

const PetFormDialogs = deferredUntil(() =>
  import('./pet-form-dialogs').then((module) => module.PetFormDialogs),
)

// Aparte de `PetForm`: con esto al abrir, editar un animal pasaba los 150 KB (historia #338).
// Pasa de 150 líneas a propósito: lo que queda es el cableado entre los hooks y los componentes con
// nombre, y partirlo esconde el recorrido de una publicación en más archivos.
export function PetFormBody({
  texts,
  departments,
  localitiesByDepartment,
  returnTo,
  editing,
  ownQuestions,
  draft,
  photos,
  idFor,
  photosError,
  go,
  onBusyChange,
}: Props) {
  const { values } = draft
  const [fieldErrors, setFieldErrors] = useState<PetFieldErrors>({})
  // Mientras bajan las reglas de zod la tirita ya trabaja: el toque contesta antes de validar.
  const [checking, setChecking] = useState(false)
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
    photosError,
  })
  const submitter = usePetSubmit({ photos, returnTo, onOutcome: feedback.apply })
  const hasPhotos = photos.list.slots.length > 0
  const busy = submitter.busy || checking

  useEffect(() => {
    onBusyChange(busy)
  }, [busy, onBusyChange])

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

  function change<K extends keyof PetFormValues>(key: K, value: PetFormValues[K]) {
    draft.markStarted()
    draft.setValues((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => withoutFieldError(current, key))
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

  async function check() {
    setChecking(true)
    const rules = await loadPetRules().catch(() => null)
    setChecking(false)
    if (rules === null) {
      feedback.apply({ kind: 'offline' })
      return
    }
    const { validatePet, contactRejections } = rules
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

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    void check()
  }

  const errorFor = (field: PetField) => {
    const found = fieldErrors[field]
    return found === undefined
      ? undefined
      : fillFragment(texts.errors[found.key] ?? found.key, found.values?.fragment)
  }

  return (
    <>
      {/* `contents`: los campos siguen en la columna del formulario, debajo de las fotos. */}
      <form onSubmit={submit} noValidate className="contents">
        <PetFields
          texts={texts.fields}
          values={values}
          departments={departments}
          localities={localitiesByDepartment[values.department] ?? []}
          errorFor={errorFor}
          idFor={idFor}
          ownQuestions={ownQuestions}
          onChange={change}
          footer={
            <PetSaveFooter
              texts={texts}
              busy={busy}
              progress={submitter.progress}
              error={feedback.error}
              changedElsewhere={feedback.changedElsewhere}
              onReopen={() => go(returnTo, true)}
            />
          }
        />
      </form>

      <PetFormDialogs
        when={feedback.duplicate !== null || feedback.blocked !== null}
        props={{
          texts: texts.dialogs,
          duplicateTitle: petDuplicateTitle(texts.dialogs, feedback.duplicate),
          blocked: feedback.blocked,
          hasPhotos,
          busy: submitter.busy,
          onPublishAnyway: () => send(true),
          onBackToMyPets: () => go(MY_PETS_PATH),
          onCloseDuplicate: feedback.closeDuplicate,
          onUnblock: () =>
            go(
              feedback.blocked?.kind === 'level'
                ? feedback.blocked.gatePath
                : `/entrar?next=${encodeURIComponent(returnTo)}`,
            ),
          onCloseBlocked: feedback.closeBlocked,
        }}
      />
    </>
  )
}
