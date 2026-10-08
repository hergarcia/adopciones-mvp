'use client'

import { useRouter } from 'next/navigation'
import { fillFragment } from '@/lib/forms/fill-fragment'

type Options = {
  /** Las claves que no refrescan la pantalla, porque refrescar se llevaría lo escrito. */
  keep?: readonly string[]
}

// Los errores de responder una solicitud (preguntar, contestar, rechazar): el texto de cada clave, los
// de contacto con el fragmento que citan, y uno que no es «no se pudo» quiere decir que la solicitud
// cambió mientras tanto, así que la pantalla de atrás se refresca con el estado real (FR-044).
export function useResponseErrors(
  errors: Record<string, string>,
  failed: string,
  { keep = [] }: Options = {},
) {
  const router = useRouter()

  function message(key: string, fragment?: string): string | undefined {
    const text = errors[key]
    return text === undefined ? undefined : fillFragment(text, fragment)
  }

  function failure(error: string | undefined): string | undefined {
    const key = error ?? failed
    if (key !== failed && !keep.includes(key)) router.refresh()
    return message(key) ?? message(failed)
  }

  return { message, failure }
}
