'use client'

import { drawnOnly } from '@/components/ui/deferred'

export const LazyExitQuestion = drawnOnly(() =>
  import('./exit-question').then((module) => module.ExitQuestion),
)
