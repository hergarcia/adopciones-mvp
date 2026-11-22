'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

export default lazyErrorBoundary(() =>
  import('./my-blocks-error').then((module) => module.MyBlocksError),
)
