'use client'

import { usePathname } from 'next/navigation'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/cn'

// Un enlace de la cabecera. La cabecera vive en el layout, que no sabe en qué pantalla está: esta
// hoja lo lee de la dirección y marca la actual con el subrayado grueso del `ghost`, quieto.
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const current = usePathname() === href

  return (
    <LinkButton
      href={href}
      variant="ghost"
      aria-current={current ? 'page' : undefined}
      className={cn('text-base sm:text-lg', current && 'decoration-4')}
    >
      {children}
    </LinkButton>
  )
}
