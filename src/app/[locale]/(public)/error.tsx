'use client'

import { lazyErrorBoundary } from '@/app/[locale]/_components/lazy-error-boundary'

// Sin decir si la persona existe: un perfil que no se pudo traer no es uno que no existe.
export default lazyErrorBoundary(() =>
  import('@/app/[locale]/(public)/_components/public-error').then((module) => module.PublicError),
)
