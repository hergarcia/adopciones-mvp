'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { BusyLabel, button } from './button'

type Props = {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tirita'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const isPlainClick = (event: React.MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

// Un `LinkButton` hacia una pantalla que el navegador carga entera, como la que sigue a «Acá no hay
// nada»: esa pantalla tiene su propio documento y Next no la cambia adentro, así que `useLinkStatus`
// nunca se entera (historia #344). Trabaja desde el toque hasta que la página se va, y un segundo
// toque no la pide de nuevo. Al volver con «Atrás» desde la caché del navegador queda quieto otra vez.
export function FullPageLinkButton({ href, children, variant, size, className }: Props) {
  const [opening, setOpening] = useState(false)
  const leaving = useRef(false)

  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      leaving.current = false
      setOpening(false)
    }
    addEventListener('pageshow', reset)
    return () => removeEventListener('pageshow', reset)
  }, [])

  return (
    <a
      href={href}
      aria-busy={opening || undefined}
      className={cn(button({ variant, size }), className)}
      onClick={(event) => {
        if (!isPlainClick(event)) return
        if (leaving.current) event.preventDefault()
        leaving.current = true
        setOpening(true)
      }}
    >
      {opening ? <span data-link-opening hidden /> : null}
      <BusyLabel loading={opening}>{children}</BusyLabel>
    </a>
  )
}
