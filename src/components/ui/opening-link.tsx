'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { OpeningMark } from './opening-mark'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  /** `false` donde abrir la página registra algo: traerla por adelantado lo contaría. */
  prefetch?: boolean
  'aria-label'?: string
}

// Un enlace sin texto de carga que igual contesta al toque: desde que se suelta hasta que aparece lo
// que abre queda apagado, sin rueda (`OpeningMark`), y un segundo toque mientras abre no lo pide de
// nuevo, porque abrir la explicación de los niveles o una pregunta se cuenta (historia #350).
// `onNavigate` corre solo en la navegación dentro del sitio: abierto en otra pestaña no se apaga.
export function OpeningLink({ children, ...link }: Props) {
  const opening = useRef(false)
  return (
    <Link
      {...link}
      onNavigate={(event) => {
        if (opening.current) event.preventDefault()
        opening.current = true
      }}
    >
      {children}
      <OpeningMark
        onSettled={() => {
          opening.current = false
        }}
      />
    </Link>
  )
}
