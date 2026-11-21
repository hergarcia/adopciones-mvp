'use client'

import { drawnOnly } from '@/components/ui/deferred'

export const LazyFollowUpForm = drawnOnly(() =>
  import('./follow-up-form').then((module) => module.FollowUpForm),
)
