'use client'

import { checkPetAttempt, trackPetMoment } from '@/actions/pets'
import { PET_DRAFT_KEY } from '@/lib/drafts/account-drafts'
import type { PetFormValues } from '@/lib/pets/types'
import { useFormDraft } from './use-form-draft'

export type { DraftNotice } from './use-form-draft'

// Solo si hay algo guardado: al editar no hay borrador, y bajarlo igual sumaba al total (#338).
const loadDraftRules = () => import('@/lib/pets/draft')

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
    read: async (raw, id, now) => (await loadDraftRules()).readPetDraft(raw, id, now),
    checkAttempt: checkPetAttempt,
    onStart: () => void trackPetMoment('pet_publish_started', { litter: false }),
  })
}
