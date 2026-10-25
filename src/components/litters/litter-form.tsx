'use client'

import { useId } from 'react'
import { DraftRestoredNote } from '@/components/pets/draft-restored-note'
import { PetFormDialogs } from '@/components/pets/pet-form-dialogs'
import { PetNameField } from '@/components/pets/pet-name-field'
import { PetPhotosField } from '@/components/pets/pet-photos-field'
import { PetSaveFooter } from '@/components/pets/pet-save-footer'
import { PetTraitsFields } from '@/components/pets/pet-traits-fields'
import { useLeaveForm } from '@/hooks/use-leave-form'
import { useLitterDraft } from '@/hooks/use-litter-draft'
import { LITTER_PHOTOS, useLitterPhotos } from '@/hooks/use-litter-photos'
import { useLitterPublish } from '@/hooks/use-litter-publish'
import { useLitterValues } from '@/hooks/use-litter-values'
import type { PetPhotoSlot } from '@/hooks/use-pet-photos'
import { fillFragment } from '@/lib/forms/fill-fragment'
import { firstLitterError } from '@/lib/litters/first-error'
import type { LitterEditing, LitterFormValues } from '@/lib/litters/types'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { PetFormValues } from '@/lib/pets/types'
import type { FieldError } from '@/lib/schemas/field-error'
import type { LitterErrors, LitterField, YoungField } from '@/lib/schemas/litter'
import { LitterApplyFields } from './litter-apply-fields'
import { RemoveYoungDialog } from './remove-young-dialog'
import type { LitterFormTexts } from './litter-form-types'
import { SingleYoungDialog } from './single-young-dialog'
import { YoungList } from './young-list'

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
  /** Solo al publicar, «Publicarla como un animal» (FR-012): el formulario de un animal con lo cargado. */
  onSingleYoung?: (seed: { values: PetFormValues; photos: PetPhotoSlot[] }) => void
  /** Solo al editar: la camada y sus fotos publicadas, por grupo (FR-018). */
  editing?: LitterEditing & {
    photos: { litter: PetPhotoSlot[]; young: Record<string, PetPhotoSlot[]> }
  }
}

// Publicar o editar una camada: las fotos y lo común una vez, las crías con lo suyo y, al pie, para
// quién y desde cuándo (FR-004 a FR-020). Como `PetForm`, coordina y cambia el verbo; lo que tiene
// lógica vive en los hooks (lo escrito, las fotos, los cambios, el guardado) y en `lib/`.
//
// Pasa de 150 líneas por lo mismo que `PetForm`: lo que queda es el cableado entre los hooks y los
// componentes con nombre, y partirlo esconde el recorrido de una publicación en más archivos.
export function LitterForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  accountId,
  returnTo,
  today,
  onSingleYoung,
  editing,
}: Props) {
  const base = useId()
  const fieldId = (field: LitterField | 'photos') => `${base}-${field}`
  const youngId = (key: string, field: YoungField | 'photos') => `${base}-${key}-${field}`
  const listId = `${base}-young`
  const draft = useLitterDraft(accountId, initial, editing === undefined)
  const published: Record<string, PetPhotoSlot[]> | undefined = editing && {
    ...editing.photos.young,
    [LITTER_PHOTOS]: editing.photos.litter,
  }
  const photos = useLitterPhotos(published)
  const { values } = draft
  const edit = useLitterValues({
    draft,
    defaultName: texts.young.defaultName,
    onYoungRemoved: photos.drop,
  })
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
  const { leavingTo, leave, stay, go } = useLeaveForm(dirty)
  const publish = useLitterPublish({
    values,
    draft,
    photos,
    texts: {
      offline: texts.pet.offline,
      site: texts.pet.site,
      photosBlocked: texts.pet.errors['pets.errors.photos_blocked'] ?? '',
      photosRequired: texts.pet.errors['pets.errors.photos_required'] ?? '',
    },
    returnTo,
    today,
    go,
    focusFirst,
    onSingleYoung,
    editing,
  })
  const { errors, feedback } = publish

  function focusFirst(found: LitterErrors, photosMissing: boolean) {
    const target = firstLitterError(found, values.young, photosMissing)
    if (target === null) return
    const id =
      target.kind === 'young'
        ? youngId(target.key, target.field)
        : target.kind === 'count'
          ? listId
          : fieldId(target.field)
    const element = document.getElementById(id)
    const control = element?.matches('input, textarea, button, h2')
      ? element
      : element?.querySelector('input')
    control?.focus()
  }

  const message = (error: FieldError | null | undefined) =>
    error
      ? fillFragment(texts.pet.errors[error.key] ?? error.key, error.values?.fragment)
      : undefined
  const counts = { left: texts.pet.fields.charsLeft, over: texts.pet.fields.charsOver }

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void publish.submit()
        }}
        noValidate
        className="mt-6 flex flex-col gap-10"
      >
        {draft.notice === null ? null : (
          <div className="max-w-[var(--measure)]">
            <DraftRestoredNote
              notice={draft.notice}
              texts={texts.pet.draft}
              onStartOver={() => {
                draft.startOver()
                publish.clearErrors()
              }}
            />
          </div>
        )}
        <div className="flex flex-col gap-8">
          <PetPhotosField
            texts={texts.pet.photos}
            list={photos.listOf(LITTER_PHOTOS)}
            errors={texts.pet.errors}
            error={feedback.photosError ?? undefined}
            inputId={fieldId('photos')}
            disabled={publish.busy}
            onPick={(files) => {
              draft.markStarted()
              feedback.setPhotosError(null)
              photos.pick(LITTER_PHOTOS, files)
            }}
            onMove={(key, step) => photos.move(LITTER_PHOTOS, key, step)}
            onMakeCover={(key) => photos.makeCover(LITTER_PHOTOS, key)}
            onRemove={(key) => photos.remove(LITTER_PHOTOS, key)}
          />
          <PetTraitsFields
            texts={texts.pet.fields}
            values={values}
            departments={departments}
            localities={localitiesByDepartment[values.department] ?? []}
            errorFor={(field) => message(errors.fields[field])}
            idFor={fieldId}
            onChange={edit.changeTrait}
            name={
              <PetNameField
                texts={{ label: texts.pet.fields.name, hint: texts.nameHint, counts }}
                value={values.name}
                error={message(errors.fields.name)}
                id={fieldId('name')}
                onChange={(value) => edit.change('name', value)}
              />
            }
          />
        </div>

        <YoungList
          texts={texts.young}
          young={values.young}
          photos={photos}
          photoErrors={texts.pet.errors}
          errorFor={(key, field) => message(errors.young[key]?.[field])}
          countError={message(errors.count)}
          idFor={youngId}
          listId={listId}
          disabled={publish.busy}
          onChange={edit.changeYoung}
          onPickPhotos={(key, files) => {
            draft.markStarted()
            photos.pick(key, files)
          }}
          onAdd={edit.addYoung}
          onRemove={edit.removeYoung}
        />

        <LitterApplyFields
          texts={{ ...texts.apply, requiredLevel: texts.pet.fields.requiredLevel }}
          values={values}
          errors={{
            requiredLevel: message(errors.fields.requiredLevel),
            deliversFrom: message(errors.fields.deliversFrom),
          }}
          ids={{ requiredLevel: fieldId('requiredLevel'), deliversFrom: fieldId('deliversFrom') }}
          today={today}
          onChange={edit.change}
          footer={
            <PetSaveFooter
              texts={texts.pet}
              busy={publish.busy}
              progress={publish.progress}
              error={feedback.error}
              changedElsewhere={feedback.changedElsewhere}
              onReopen={() => go(returnTo, true)}
            />
          }
        />
      </form>

      <PetFormDialogs
        texts={{ ...texts.pet.dialogs, duplicateBody: texts.duplicate.body }}
        leaving={leavingTo !== null}
        duplicateTitle={
          publish.duplicateName === null
            ? null
            : (texts.duplicate.title[values.species] ?? '').replace('{name}', publish.duplicateName)
        }
        blocked={feedback.blocked}
        hasPhotos={hasPhotos}
        busy={publish.sending}
        onStay={stay}
        onLeave={leave}
        onPublishAnyway={publish.send}
        onBackToMyPets={() => go(MY_PETS_PATH)}
        onCloseDuplicate={publish.closeDuplicate}
        onUnblock={() =>
          go(
            feedback.blocked?.kind === 'level'
              ? feedback.blocked.gatePath
              : `/entrar?next=${encodeURIComponent(returnTo)}`,
          )
        }
        onCloseBlocked={feedback.closeBlocked}
      />
      <RemoveYoungDialog
        removal={publish.removal.removal}
        texts={texts.removal}
        onSave={publish.removal.confirmClose}
        onDelete={publish.removal.deleteAll}
        onCancel={publish.removal.cancel}
      />
      <SingleYoungDialog
        open={publish.single}
        texts={{ ...texts.single, close: texts.pet.dialogs.close }}
        onPublishAsPet={publish.publishAsPet}
        onAddYoung={() => {
          publish.closeSingle()
          edit.addYoung()
        }}
        onClose={publish.closeSingle}
      />
    </>
  )
}
