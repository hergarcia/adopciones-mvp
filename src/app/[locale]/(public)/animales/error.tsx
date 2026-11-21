'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

// Lo inesperado: si la base no responde, la página ya dibuja el listado en su estado de error, con
// los filtros a la vista (plan §Listado).
export default lazyErrorBoundary(() =>
  import('@/app/[locale]/(public)/_components/public-error').then((module) => module.PublicError),
)
