'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

export default lazyErrorBoundary(() =>
  import('./verify-identity-error').then((module) => module.VerifyIdentityError),
)
