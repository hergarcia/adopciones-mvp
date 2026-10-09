'use client'

import { usePathname } from 'next/navigation'
import { TextLink } from '@/components/ui/text-link'
import { QUESTIONS_PATH } from '@/lib/questions/paths'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'
import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'

// Una falla nunca deja la hoja en blanco: reintentar, y una salida que no es la pantalla que falló
// (el listado si falló el índice, el índice si falló una página).
export default function Error({ reset }: { reset: () => void }) {
  const copy = usePublicErrorCopy()
  const pathname = usePathname()
  if (copy?.exits === undefined) return null
  const exit = pathname.endsWith(QUESTIONS_PATH) ? copy.exits.listing : copy.exits.index

  return (
    <ErrorScreen title={copy.title} body={copy.body} retry={copy.retry} reset={reset}>
      <div className="flex justify-center">
        <TextLink href={exit.href}>{exit.label}</TextLink>
      </div>
    </ErrorScreen>
  )
}
