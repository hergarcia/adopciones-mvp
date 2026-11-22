'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

export default lazyErrorBoundary(() =>
  import('./edit-pet-error').then((module) => module.EditPetError),
)
