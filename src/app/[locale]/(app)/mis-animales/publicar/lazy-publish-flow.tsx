'use client'

import { drawnOnly } from '@/components/ui/deferred'

export const LazyPublishFlow = drawnOnly(() =>
  import('./publish-flow').then((module) => module.PublishFlow),
)
