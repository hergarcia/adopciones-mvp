'use client'

import { startTransition, useActionState, useEffect, useEffectEvent, useRef } from 'react'
import type { ActionResult } from '@/actions/result'
import { Button } from '@/components/ui/button'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { Skeleton } from '@/components/ui/skeleton'
import { LISTING_PATH } from '@/lib/pets/paths'

export type UnsubscribeTexts = {
  /** El `h1` mientras corta, solo para el lector de pantalla: el visible es un esqueleto. */
  heading: string
  cutting: string
  ask: string
  askBody: string
  confirm: string
  doneTitle: string
  doneBody: string
  listing: string
  failedTitle: string
  failedBody: string
  retry: string
}

type Props = {
  /** La acción con el token ya puesto: nunca mira la sesión. */
  unsubscribe: () => Promise<ActionResult<null>>
  /** Lo que dice la pantalla de un enlace que no sirve, por si dejó de servir al abrirlo. */
  invalid: React.ReactNode
  texts: UnsubscribeTexts
}

const UNKNOWN_LINK = 'alerts.errors.unknown_link'
const FADE = 'animate-[fade-in_var(--dur-base)_var(--ease-out)]'

// «Dejar de recibir» (research R7): corta al montar, sin otro toque. Un lector de correo que abre el
// enlace no corre JavaScript, así que no corta nada; una persona sin JavaScript ve la pregunta con el
// botón, que manda el mismo formulario.
export function UnsubscribeRunner({ unsubscribe, invalid, texts }: Props) {
  const [result, run, pending] = useActionState<ActionResult<null> | null>(unsubscribe, null)
  const started = useRef(false)

  const cutOnOpen = useEffectEvent(() => {
    if (started.current) return
    started.current = true
    startTransition(() => run())
  })
  useEffect(() => cutOnOpen(), [])

  return <div aria-live="polite">{view()}</div>

  function view() {
    if (pending || result === null) {
      return (
        <>
          <div aria-busy className="noscript:hidden">
            <h1 className="sr-only">{texts.heading}</h1>
            <div className="flex flex-col items-center gap-3 text-center">
              <Skeleton className="h-8 w-64 max-w-full" />
              <p className="text-base text-ink-muted">{texts.cutting}</p>
            </div>
          </div>
          <div className="hidden noscript:block">
            <HeadedEmptyState
              title={texts.ask}
              body={texts.askBody}
              action={
                <form action={run}>
                  <Button type="submit">{texts.confirm}</Button>
                </form>
              }
            />
          </div>
        </>
      )
    }

    if (result.ok) {
      return (
        <div className={FADE}>
          <HeadedEmptyState
            title={texts.doneTitle}
            body={texts.doneBody}
            action={
              <LinkButton href={LISTING_PATH} variant="secondary">
                {texts.listing}
              </LinkButton>
            }
          />
        </div>
      )
    }

    if (result.error === UNKNOWN_LINK) return <div className={FADE}>{invalid}</div>

    return (
      <div className={FADE}>
        <HeadedEmptyState
          title={texts.failedTitle}
          body={texts.failedBody}
          action={
            <form action={run}>
              <Button type="submit" variant="secondary">
                {texts.retry}
              </Button>
            </form>
          }
        />
      </div>
    )
  }
}
