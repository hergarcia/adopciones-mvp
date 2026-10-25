'use client'

import { checkPetAttempt, trackPetMoment } from '@/actions/pets'
import { PET_DRAFT_KEY } from '@/lib/drafts/account-drafts'
import { readPetDraft } from '@/lib/pets/draft'
import type { PetFormValues } from '@/lib/pets/types'
import { useFormDraft } from './use-form-draft'

export type { DraftNotice } from './use-form-draft'

/** Lo escrito de un animal nuevo (FR-024 de la #53). */
export function usePetDraft(
  accountId: string,
  empty: PetFormValues,
  enabled: boolean,
  restore = true,
) {
  return useFormDraft({
    storageKey: PET_DRAFT_KEY,
    accountId,
    empty,
    enabled,
    restore,
    read: readPetDraft,
    checkAttempt: checkPetAttempt,
    onStart: () => void trackPetMoment('pet_publish_started', { litter: false }),
  })
}
