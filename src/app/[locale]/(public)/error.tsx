'use client'

import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'
import { PublicErrorScreen } from '@/app/[locale]/_components/public-error-screen'

// Sin decir si la persona existe: un perfil que no se pudo traer no es uno que no existe.
export default function Error({ reset }: { reset: () => void }) {
  const copy = usePublicErrorCopy()
  if (copy === null) return null
  return <PublicErrorScreen title={copy.title} body={copy.body} retry={copy.retry} reset={reset} />
}
