'use client'

import { drawnOnly } from '@/components/ui/deferred'

export const LazyAcceptCommitmentButton = drawnOnly(() =>
  import('./accept-commitment-button').then((module) => module.AcceptCommitmentButton),
)

export const LazyDeclineAdoptionDialog = drawnOnly(() =>
  import('./decline-adoption-dialog').then((module) => module.DeclineAdoptionDialog),
)
