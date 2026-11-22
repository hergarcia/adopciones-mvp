'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { PetNameField } from '@/components/pets/pet-name-field'
import { PetSaveFooter } from '@/components/pets/pet-save-footer'
import { PetTraitsFields } from '@/components/pets/pet-traits-fields'
import { deferredUntil } from '@/components/ui/deferred'
import type { useLitterDraft } from '@/hooks/use-litter-draft'
import type { LitterPhotos } from '@/hooks/use-litter-photos'
import { useLitterPublish } from '@/hooks/use-litter-publish'
import { useLitterValues } from '@/hooks/use-litter-values'
import type { PetPhotoSlot } from '@/hooks/use-pet-photos'
import { fillFragment } from '@/lib/forms/fill-fragment'
import type { LitterField, YoungField } from '@/lib/litters/fields'
import { firstLitterError } from '@/lib/litters/first-error'
import type { LitterEditing } from '@/lib/litters/types'
import type { OwnQuestionSuggestion } from '@/lib/pets/own-question-suggestions'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { PetFormValues } from '@/lib/pets/types'
import type { FieldError } from '@/lib/schemas/field-error'
import type { LitterErrors } from '@/lib/schemas/litter'
import { LitterApplyFields } from './litter-apply-fields'
import type { LitterFormTexts } from './litter-form-types'
import { YoungList } from './young-list'

type Props = {
  texts: LitterFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  returnTo: string
  today: string
  ownQuestions: readonly OwnQuestionSuggestion[]
  onSingleYoung?: (seed: { values: PetFormValues; photos: PetPhotoSlot[] }) => void
  editing?: LitterEditing
  draft: ReturnType<typeof useLitterDraft>
  photos: LitterPhotos
  ids: {
    field: (field: LitterField | 'photos') => string
    young: (key: string, field: YoungField | 'photos') => string
    list: string
  }
  photosError: [string | null, Dispatch<SetStateAction<string | null>>]
  hasPhotos: boolean
  go: (url: string, hard?: boolean) => void
  onBusyChange: (busy: boolean) => void
}

const LitterFormDialogs = deferredUntil(() =>
  import('./litter-form-dialogs').then((module) => module.LitterFormDialogs),
)

// Aparte de `LitterForm`: con esto al abrir, la camada pasaba los 150 KB (historia #338).
// Pasa de 150 líneas por lo mismo que `PetFormBody`: lo que queda es el cableado entre los hooks y
// los componentes con nombre, y partirlo esconde el recorrido de una publicación en más archivos.
export function LitterFormBody({
  texts,
  departments,
  localitiesByDepartment,
  returnTo,
  today,
  ownQuestions,
  onSingleYoung,
  editing,
  draft,
  photos,
  ids,
  photosError,
  hasPhotos,
  go,
  onBusyChange,
}: Props) {
  const { values } = draft
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
    photosError,
  })
  const { errors, feedback } = publish
  const edit = useLitterValues({
    draft,
    defaultName: texts.young.defaultName,
    onYoungRemoved: photos.drop,
    onEdited: publish.clearField,
    onYoungEdited: publish.clearYoungField,
  })

  useEffect(() => {
    onBusyChange(publish.busy)
  }, [publish.busy, onBusyChange])

  function focusFirst(found: LitterErrors, photosMissing: boolean) {
    const target = firstLitterError(found, values.young, photosMissing)
    if (target === null) return
    const id =
      target.kind === 'young'
        ? ids.young(target.key, target.field)
        : target.kind === 'count'
          ? ids.list
          : ids.field(target.field)
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
      {/* `contents`: lo común sigue debajo de las fotos, y las crías y el pie con su aire. */}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void publish.submit()
        }}
        noValidate
        className="contents"
      >
        <PetTraitsFields
          texts={texts.pet.fields}
          values={values}
          departments={departments}
          localities={localitiesByDepartment[values.department] ?? []}
          errorFor={(field) => message(errors.fields[field])}
          idFor={ids.field}
          onChange={edit.changeTrait}
          name={
            <PetNameField
              texts={{ label: texts.pet.fields.name, hint: texts.nameHint, counts }}
              value={values.name}
              error={message(errors.fields.name)}
              id={ids.field('name')}
              onChange={(value) => edit.change('name', value)}
            />
          }
        />
        <div className="mt-2 flex flex-col gap-10">
          <YoungList
            texts={texts.young}
            young={values.young}
            photos={photos}
            photoErrors={texts.pet.errors}
            errorFor={(key, field) => message(errors.young[key]?.[field])}
            countError={message(errors.count)}
            idFor={ids.young}
            listId={ids.list}
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
            texts={{
              ...texts.apply,
              requiredLevel: texts.pet.fields.requiredLevel,
              ownQuestion: { ...texts.pet.fields.ownQuestion, counts },
            }}
            values={values}
            errors={{
              requiredLevel: message(errors.fields.requiredLevel),
              deliversFrom: message(errors.fields.deliversFrom),
              ownQuestion: message(errors.fields.ownQuestion),
            }}
            ids={{
              requiredLevel: ids.field('requiredLevel'),
              deliversFrom: ids.field('deliversFrom'),
              ownQuestion: ids.field('ownQuestion'),
            }}
            today={today}
            ownQuestions={ownQuestions}
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
        </div>
      </form>

      <LitterFormDialogs
        when={
          publish.duplicateName !== null ||
          feedback.blocked !== null ||
          publish.removal.removal !== null ||
          publish.single
        }
        props={{
          pet: {
            texts: { ...texts.pet.dialogs, duplicateBody: texts.duplicate.body },
            duplicateTitle:
              publish.duplicateName === null
                ? null
                : (texts.duplicate.title[values.species] ?? '').replace(
                    '{name}',
                    publish.duplicateName,
                  ),
            blocked: feedback.blocked,
            hasPhotos,
            busy: publish.sending,
            onPublishAnyway: publish.send,
            onBackToMyPets: () => go(MY_PETS_PATH),
            onCloseDuplicate: publish.closeDuplicate,
            onUnblock: () =>
              go(
                feedback.blocked?.kind === 'level'
                  ? feedback.blocked.gatePath
                  : `/entrar?next=${encodeURIComponent(returnTo)}`,
              ),
            onCloseBlocked: feedback.closeBlocked,
          },
          removal: {
            removal: publish.removal.removal,
            texts: texts.removal,
            onSave: publish.removal.confirmClose,
            onDelete: publish.removal.deleteAll,
            onCancel: publish.removal.cancel,
          },
          single: {
            open: publish.single,
            texts: { ...texts.single, close: texts.pet.dialogs.close },
            onPublishAsPet: publish.publishAsPet,
            onAddYoung: () => {
              publish.closeSingle()
              edit.addYoung()
            },
            onClose: publish.closeSingle,
          },
        }}
      />
    </>
  )
}
