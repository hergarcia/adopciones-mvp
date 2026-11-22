'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

export default lazyErrorBoundary(() =>
  import('./edit-litter-error').then((module) => module.EditLitterError),
)
