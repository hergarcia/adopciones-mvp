'use client'

import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'
import { PublicErrorScreen } from '@/app/[locale]/_components/public-error-screen'

// Lo inesperado: si la base no responde, la página ya dibuja el listado en su estado de error, con
// los filtros a la vista (plan §Listado).
export default function Error({ reset }: { reset: () => void }) {
  const copy = usePublicErrorCopy()
  if (copy === null) return null
  return <PublicErrorScreen title={copy.title} body={copy.body} retry={copy.retry} reset={reset} />
}
