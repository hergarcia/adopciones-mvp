'use client'

import { checkLitterAttempt } from '@/actions/litters'
import { trackPetMoment } from '@/actions/pets'
import { LITTER_DRAFT_KEY } from '@/lib/drafts/account-drafts'
import { readLitterDraft } from '@/lib/litters/draft'
import type { LitterFormValues } from '@/lib/litters/types'
import { useFormDraft } from './use-form-draft'

/**
 * Lo escrito de una camada nueva, con sus crías y sin las fotos (FR-017). Al editar no se guarda:
 * lo publicado ya está, como al editar un animal.
 */
export function useLitterDraft(accountId: string, empty: LitterFormValues, enabled = true) {
  return useFormDraft({
    storageKey: LITTER_DRAFT_KEY,
    accountId,
    empty,
    enabled,
    read: readLitterDraft,
    checkAttempt: checkLitterAttempt,
    onStart: () => void trackPetMoment('pet_publish_started', { litter: true }),
  })
}
