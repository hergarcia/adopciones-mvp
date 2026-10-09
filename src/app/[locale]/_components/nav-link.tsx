'use client'

import { usePathname } from 'next/navigation'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/cn'

// Un enlace de la cabecera. La cabecera vive en el layout, que no sabe en qué pantalla está: esta
// hoja lo lee de la dirección y marca la actual con el subrayado grueso del `ghost`, quieto.
type Props = {
  href: string
  children: React.ReactNode
  /** `false` en los enlaces que aparecen con sesión: la precarga de `Link` se bajaba sus scripts
   * mientras la pantalla todavía abría, y en un teléfono eso contaba como peso de apertura. */
  prefetch?: boolean
}

export function NavLink({ href, children, prefetch }: Props) {
  // Sin la consulta: «Administrar» lleva `?desde=menu` para medir de dónde se llegó.
  const current = usePathname() === href.split('?')[0]

  return (
    <LinkButton
      href={href}
      variant="ghost"
      aria-current={current ? 'page' : undefined}
      className={cn('text-base sm:text-lg', current && 'decoration-4')}
      prefetch={prefetch}
    >
      {children}
    </LinkButton>
  )
}
