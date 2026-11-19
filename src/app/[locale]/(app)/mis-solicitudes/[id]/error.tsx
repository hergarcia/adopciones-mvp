'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

export default lazyErrorBoundary(() =>
  import('@/app/[locale]/(app)/mis-solicitudes/my-applications-error').then(
    (module) => module.MyApplicationsError,
  ),
)
