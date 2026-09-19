'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorText } from '@/components/ui/error-text'
import { LinkButton } from '@/components/ui/link-button'
import { resendLinkFor } from '@/actions/auth'
import { inSeconds, type SecondForms } from '@/lib/i18n/plural'

export type LinkProblemTexts = {
  title: string
  /** Cuál de los motivos fue, ya resuelto en el servidor. */
  message: string
  resend: string
  startOver: string
  /** Lo que dice la pantalla cuando el enlace nuevo salió. */
  sentTitle: string
  sentBody: string
  /** Por clave de error, ya traducidos. */
  errors: Record<string, string>
  rateLimited: SecondForms
}

type Props = {
  /** El id del enlace, cuando pedir otro tiene sentido. */
  linkId: string | null
  texts: LinkProblemTexts
}

// La pantalla entera y no solo el botón: al mandar el enlace nuevo, el título en voz de afiche es
// lo más grande que hay acá, y dejarlo diciendo «El enlace no sirve» contradice lo que la persona
// acaba de conseguir (docs/10 §Textos).
//
// Manda el **id del enlace**, no una dirección: el servidor resuelve el correo y la pantalla nunca
// lo conoce, así que no lo puede mostrar (FR-005b). Un enlace se abre por reenvío o desde un buzón
// compartido, y quien lo mira puede no ser su dueña.
export function LinkProblemScreen({ linkId, texts }: Props) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resend() {
    if (linkId === null) return

    // Los dos estados se apagan juntos: son excluyentes, y dejar la confirmación anterior debajo
    // de un error diría dos cosas opuestas a la vez.
    setSent(false)
    setError(null)

    startTransition(async () => {
      const result = await resendLinkFor(linkId)
      if (result.ok) {
        setSent(true)
        return
      }

      // El mensaje que corresponde al motivo: decirle «tu enlace es muy viejo» a quien tocó dos
      // veces en un minuto no le explica nada ni le dice cuánto falta.
      setError(
        result.seconds === undefined
          ? (texts.errors[result.error] ?? result.error)
          : inSeconds(result.seconds, texts.rateLimited),
      )
    })
  }

  // Un h1 por pantalla, también en las que son un estado vacío (docs/10 §Piso de accesibilidad).
  // Va centrado como el resto del bloque: docs/10 §Layout admite centrar en vacíos y
  // confirmaciones, y es la única excepción a la alineación a la izquierda.
  if (sent) {
    return (
      <>
        <h1 className="afiche text-center text-2xl text-ink">{texts.sentTitle}</h1>
        <EmptyState title={texts.sentBody} />
      </>
    )
  }

  return (
    <>
      <h1 className="afiche text-center text-2xl text-ink">{texts.title}</h1>
      <EmptyState
        title={texts.message}
        action={
          <div className="flex flex-col items-center gap-3">
            {linkId === null ? (
              <LinkButton href="/entrar" variant="ghost">
                {texts.startOver}
              </LinkButton>
            ) : (
              <Button variant="secondary" onClick={resend} loading={pending}>
                {texts.resend}
              </Button>
            )}

            {/* Un error es un error: en acento y anunciado, no una ayuda gris que nadie escucha
                (docs/10 §Color). */}
            {error ? <ErrorText announce>{error}</ErrorText> : null}
          </div>
        }
      />
    </>
  )
}
