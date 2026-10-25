'use client'

import { useState } from 'react'
import { findLitterDuplicate, publishLitter } from '@/actions/litters'
import { trackPetMoment } from '@/actions/pets'
import { litterFormData } from '@/lib/litters/form-data'
import { singleYoungSeed } from '@/lib/litters/single-young-seed'
import type { LitterFormValues } from '@/lib/litters/types'
import { withPetNotice } from '@/lib/pets/notice'
import type { PetFormValues } from '@/lib/pets/types'
import { litterContactRejections, validateLitter, type LitterErrors } from '@/lib/schemas/litter'
import { LITTER_PHOTOS, type LitterPhotos } from './use-litter-photos'
import type { PetPhotoSlot } from './use-pet-photos'
import { usePetFeedback } from './use-pet-feedback'
import { usePetSubmit } from './use-pet-submit'
import type { useLitterDraft } from './use-litter-draft'

export const NO_LITTER_ERRORS: LitterErrors = { fields: {}, young: {}, count: null }

type Options = {
  values: LitterFormValues
  draft: ReturnType<typeof useLitterDraft>
  photos: LitterPhotos
  /** Ya traducidos. */
  texts: { offline: string; site: string; photosBlocked: string; photosRequired: string }
  returnTo: string
  today: string
  go: (path: string) => void
  /** Lleva el foco al primer error, en el orden en que se lee el formulario. */
  focusFirst: (errors: LitterErrors, photosMissing: boolean) => void
  onSingleYoung: (seed: { values: PetFormValues; photos: PetPhotoSlot[] }) => void
}

// Publicar una camada, de punta a punta (FR-008 a FR-016): valida todo a la vez, con una sola cría
// ofrece pasarla a un animal, avisa el nombre repetido antes de mandar y después sube las fotos de
// cada grupo y manda la camada con el mismo intento, como un animal.
export function useLitterPublish({
  values,
  draft,
  photos,
  texts,
  returnTo,
  today,
  go,
  focusFirst,
  onSingleYoung,
}: Options) {
  const [errors, setErrors] = useState<LitterErrors>(NO_LITTER_ERRORS)
  const [duplicateName, setDuplicateName] = useState<string | null>(null)
  const [single, setSingle] = useState(false)
  const [checking, setChecking] = useState(false)
  const feedback = usePetFeedback({
    texts,
    returnTo,
    onSaved: () => {
      draft.finish()
      go(withPetNotice('published'))
    },
    // Los de la camada llegan en `detail.litter`, y `send` los pone en su lugar.
    onFieldErrors: () => undefined,
  })
  const submitter = usePetSubmit({ photos: photos.submit, returnTo, onOutcome: feedback.apply })

  function send() {
    feedback.clear()
    setDuplicateName(null)
    submitter.submit(async () => {
      const young = values.young.map((one) => ({ ...one, photoIds: photos.idsOf(one.key) }))
      const result = await publishLitter(
        litterFormData(values, young, {
          photoIds: JSON.stringify(photos.idsOf(LITTER_PHOTOS)),
          attemptId: draft.attemptId(),
          startedAt: String(draft.startedAt() ?? Date.now()),
          returnTo,
        }),
      )
      const found = result.ok ? undefined : result.detail?.litter
      if (found !== undefined) {
        setErrors(found)
        focusFirst(found, false)
      }
      return result
    })
  }

  async function submit() {
    if (submitter.busy || checking) return
    const checked = validateLitter(values, {
      publishing: true,
      today,
      storedDeliversFrom: null,
      ageUnchanged: false,
    })
    const found = checked.ok ? NO_LITTER_ERRORS : checked.errors
    const photosMissing = photos.listOf(LITTER_PHOTOS).slots.length === 0
    setErrors(found)
    feedback.setPhotosError(photosMissing ? texts.photosRequired : null)
    if (values.young.length === 1) return setSingle(true)
    if (!checked.ok || photosMissing) {
      for (const rejected of litterContactRejections(found))
        void trackPetMoment('pet_contact_rejected', rejected)
      return focusFirst(found, photosMissing)
    }
    setChecking(true)
    const duplicate = await findLitterDuplicate(checked.data.name, checked.data.species).catch(
      () => null,
    )
    setChecking(false)
    if (duplicate?.ok && duplicate.data.duplicate) return setDuplicateName(checked.data.name)
    send()
  }

  // Lo propio de la cría primero y lo común de respaldo (FR-012). Lo escrito de la camada se borra:
  // pasó al formulario del animal.
  function publishAsPet() {
    const [only] = values.young
    if (only === undefined) return
    const seed = singleYoungSeed(values, only, {
      litter: photos.slotsOf(LITTER_PHOTOS),
      young: photos.slotsOf(only.key),
    })
    draft.finish()
    onSingleYoung(seed)
  }

  return {
    errors,
    clearErrors: () => setErrors(NO_LITTER_ERRORS),
    feedback,
    progress: submitter.progress,
    sending: submitter.busy,
    busy: submitter.busy || checking,
    duplicateName,
    closeDuplicate: () => setDuplicateName(null),
    single,
    closeSingle: () => setSingle(false),
    submit,
    send,
    publishAsPet,
  }
}
