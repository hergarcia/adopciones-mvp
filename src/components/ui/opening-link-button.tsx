'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { cn } from '@/lib/cn'
import { button } from './button'
import { OpeningLabel } from './opening-label'

type Props = {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tirita'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** `false` donde abrir la página registra algo: traerla por adelantado lo contaría. */
  prefetch?: boolean
}

// Un `LinkButton` que trabaja desde el toque hasta que aparece la pantalla y no sale dos veces: un
// segundo toque mientras abre no pide la ruta de nuevo, porque abrirla es lo que cuenta cada
// «Quiero adoptar» (historia #336, #240). `onNavigate` corre solo en la navegación dentro del sitio:
// abrirlo en otra pestaña no lo deja trabado.
export function OpeningLinkButton({ href, children, variant, size, className, prefetch }: Props) {
  const opening = useRef(false)
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(button({ variant, size }), className)}
      onNavigate={(event) => {
        if (opening.current) event.preventDefault()
        opening.current = true
      }}
    >
      <OpeningLabel
        onSettled={() => {
          opening.current = false
        }}
      >
        {children}
      </OpeningLabel>
    </Link>
  )
}
