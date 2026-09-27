'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { publishPet, savePet, trackPetMoment } from '@/actions/pets'
import { usePetDraft } from '@/hooks/use-pet-draft'
import { usePetPhotos, type PetPhotoSlot } from '@/hooks/use-pet-photos'
import type { SaveOutcome } from '@/hooks/use-pet-save'
import { usePetSubmit } from '@/hooks/use-pet-submit'
import { leaveTo, useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { Age, StoredAge } from '@/lib/pets/age'
import { petFormData } from '@/lib/pets/form-data'
import { withPetNotice } from '@/lib/pets/notice'
import { MY_PETS_PATH, petGatePath } from '@/lib/pets/paths'
import type { PetFormValues } from '@/lib/pets/types'
import {
  PET_FIELDS,
  contactRejections,
  validatePet,
  type PetField,
  type PetFieldErrors,
} from '@/lib/schemas/pet'
import { DraftRestoredNote } from './draft-restored-note'
import { PetFormDialogs, type Blocked, type Duplicate } from './pet-form-dialogs'
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

function fill(template: string, fragment?: string) {
  return fragment === undefined ? template : template.replace('{fragment}', fragment)
}

// Publicar y editar son el mismo formulario y cambian el verbo (como `ProfileForm`): coordina las
// fotos, los campos, lo escrito y el guardado, con cada error debajo de su campo y el de guardado
// arriba de la tirita, que es también el reintento (FR-021).
export function PetForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  accountId,
  returnTo,
  editing,
}: Props) {
  const router = useRouter()
  const base = useId()
  const idFor = (field: PetField | 'photos') => `${base}-${field}`
  const draft = usePetDraft(accountId, initial, editing === undefined)
  const photos = usePetPhotos(editing?.photos ?? [])
  const { values } = draft
  const [fieldErrors, setFieldErrors] = useState<PetFieldErrors>({})
  const [photosError, setPhotosError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [changedElsewhere, setChangedElsewhere] = useState(false)
  const [blocked, setBlocked] = useState<Blocked | null>(null)
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null)
  const [goTo, setGoTo] = useState<{ url: string; hard: boolean } | null>(null)

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

  function showFieldErrors(errors: PetFieldErrors) {
    setFieldErrors(errors)
    focusFirst(errors, false)
  }

  function onOutcome(outcome: SaveOutcome | { kind: 'blocked' | 'empty' }) {
    const detail = 'detail' in outcome ? outcome.detail : undefined
    switch (outcome.kind) {
      case 'ok':
        if (editing === undefined) draft.finish()
        go(withPetNotice(editing === undefined ? 'published' : 'edited'))
        return
      case 'offline':
        return setError(texts.offline)
      case 'session':
        return setBlocked({ kind: 'session' })
      case 'level':
        return setBlocked({ kind: 'level', gatePath: detail?.gatePath ?? petGatePath(returnTo) })
      case 'duplicate_name':
        return setDuplicate(detail?.duplicate ?? null)
      case 'invalid':
        return showFieldErrors(detail?.fields ?? {})
      case 'changed_elsewhere':
        return setChangedElsewhere(true)
      case 'not_found':
        return router.refresh()
      case 'blocked':
        return setPhotosError(texts.errors['pets.errors.photos_blocked'] ?? null)
      case 'empty':
        return setPhotosError(texts.errors['pets.errors.photos_required'] ?? null)
      default:
        return setError(texts.site)
    }
  }

  const submitter = usePetSubmit({ photos, returnTo, onOutcome })
  const hasPhotos = photos.list.slots.length > 0
  const dirty =
    editing === undefined
      ? hasPhotos
      : JSON.stringify(values) !== JSON.stringify(initial) ||
        photos.list.slots.map((slot) => slot.key).join() !==
          editing.photos.map((slot) => slot.key).join()
  // También mientras guarda: soltar el guardia a mitad retiraría la centinela y la volvería a poner.
  const { leavingTo, leave, stay, release } = useUnsavedChanges(dirty && goTo === null)

  // Salir por un camino elegido no abre otro aviso: se suelta el guardia y se navega después.
  function go(url: string, hard = false) {
    release()
    setGoTo({ url, hard })
  }

  useEffect(() => {
    if (goTo === null) return
    if (goTo.hard) window.location.assign(goTo.url)
    else leaveTo(router, goTo.url)
  }, [goTo, router])

  function change<K extends keyof PetFormValues>(key: K, value: PetFormValues[K]) {
    draft.markStarted()
    draft.setValues((current) => ({ ...current, [key]: value }))
  }

  function send(confirmDuplicate: boolean) {
    setError(null)
    setDuplicate(null)
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
      return savePet(
        petFormData(values, {
          ...common,
          petId: editing.petId,
          ageBaseValue: String(editing.ageBase.value),
          ageBaseUnit: editing.ageBase.unit,
          ageBaseAsOf: editing.ageBase.asOf,
          ageShownValue: String(editing.ageShown.value),
          ageShownUnit: editing.ageShown.unit,
        }),
      )
    })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const checked = validatePet(values, { ageUnchanged })
    const errors = checked.ok ? {} : checked.errors
    const photosMissing = !hasPhotos
    setFieldErrors(errors)
    setPhotosError(photosMissing ? (texts.errors['pets.errors.photos_required'] ?? null) : null)
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
      : fill(texts.errors[found.key] ?? found.key, found.values?.fragment)
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-8">
        {draft.notice === null ? null : (
          <DraftRestoredNote
            notice={draft.notice}
            texts={texts.draft}
            onStartOver={draft.startOver}
          />
        )}
        <PetPhotosField
          texts={texts.photos}
          list={photos.list}
          errors={texts.errors}
          error={photosError ?? undefined}
          inputId={idFor('photos')}
          disabled={submitter.busy}
          onPick={(files) => {
            draft.markStarted()
            setPhotosError(null)
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
        />
        <PetSaveFooter
          texts={texts}
          busy={submitter.busy}
          progress={submitter.progress}
          error={error}
          changedElsewhere={changedElsewhere}
          onReopen={() => go(returnTo, true)}
        />
      </form>

      <PetFormDialogs
        texts={texts.dialogs}
        leaving={leavingTo !== null}
        duplicate={duplicate}
        blocked={blocked}
        hasPhotos={hasPhotos}
        busy={submitter.busy}
        onStay={stay}
        onLeave={leave}
        onPublishAnyway={() => send(true)}
        onBackToMyPets={() => go(MY_PETS_PATH)}
        onCloseDuplicate={() => setDuplicate(null)}
        onUnblock={() =>
          go(
            blocked?.kind === 'level'
              ? blocked.gatePath
              : `/entrar?next=${encodeURIComponent(returnTo)}`,
          )
        }
        onCloseBlocked={() => setBlocked(null)}
      />
    </>
  )
}
