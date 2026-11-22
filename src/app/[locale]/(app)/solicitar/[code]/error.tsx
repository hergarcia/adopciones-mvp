'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

export default lazyErrorBoundary(() =>
  import('./apply-form-error').then((module) => module.ApplyFormError),
)
