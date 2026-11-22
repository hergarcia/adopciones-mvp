'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { button } from '@/components/ui/button-styles'
import { OpeningMark } from '@/components/ui/opening-mark'
import { useIsCurrentPath } from '@/hooks/use-is-current-path'
import { cn } from '@/lib/cn'

// Un enlace de la cabecera. La cabecera vive en el layout, que no sabe en qué pantalla está: esta
// hoja lo lee de la dirección y marca la actual con el subrayado grueso del `ghost`, quieto.
type Props = {
  href: string
  children: React.ReactNode
  /** `false` en los enlaces que aparecen con sesión: la precarga de `Link` se bajaba sus scripts
   * mientras la pantalla todavía abría, y en un teléfono eso contaba como peso de apertura. */
  prefetch?: boolean
  /** En el menú de la cuenta, un renglón a lo ancho en lugar del tamaño de la barra. */
  className?: string
  /**
   * Sin precarga, la pantalla tarda lo que tarde el servidor: desde que se suelta hasta que aparece
   * queda apagado (`OpeningMark`) y un segundo toque no la pide de nuevo, como la chapita (historias
   * #350 y #352).
   */
  answersTap?: boolean
}

export function NavLink({ href, children, prefetch, className, answersTap = false }: Props) {
  const current = useIsCurrentPath(href)
  const opening = useRef(false)

  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      prefetch={prefetch}
      data-answers-tap={answersTap || undefined}
      onNavigate={
        answersTap
          ? (event) => {
              if (opening.current) event.preventDefault()
              opening.current = true
            }
          : undefined
      }
      className={cn(
        button({ variant: 'ghost', size: 'sm' }),
        'aria-[current=page]:decoration-4',
        className ?? 'sm:text-lg',
      )}
    >
      {children}
      {answersTap ? (
        <OpeningMark
          onSettled={() => {
            opening.current = false
          }}
        />
      ) : null}
    </Link>
  )
}
