'use client'

import { LinkButton } from '@/components/ui/link-button'
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
}

export function NavLink({ href, children, prefetch, className }: Props) {
  const current = useIsCurrentPath(href)

  return (
    <LinkButton
      href={href}
      variant="ghost"
      size="sm"
      aria-current={current ? 'page' : undefined}
      className={cn('aria-[current=page]:decoration-4', className ?? 'sm:text-lg')}
      prefetch={prefetch}
    >
      {children}
    </LinkButton>
  )
}
