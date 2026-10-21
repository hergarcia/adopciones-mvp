'use client'

import Link from 'next/link'
import { textLink } from '@/components/ui/text-link'
import { useIsCurrentPath } from '@/hooks/use-is-current-path'
import { cn } from '@/lib/cn'

type Props = {
  href: string
  children: React.ReactNode
}

// Un enlace del pie. El pie vive en el layout, que no sabe en qué pantalla está: esta hoja lo lee de
// la dirección y marca la actual con el subrayado grueso, quieto, como el menú. Sin precarga: el
// listado, los niveles, las preguntas y publicar registran algo al abrirse, y traerlos de antes lo
// contaría sin que nadie los abra.
export function FooterLink({ href, children }: Props) {
  const current = useIsCurrentPath(href)
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={current ? 'page' : undefined}
      className={cn(
        textLink({ weight: 'medium', placement: 'block' }),
        'aria-[current=page]:decoration-4',
      )}
    >
      {children}
    </Link>
  )
}
