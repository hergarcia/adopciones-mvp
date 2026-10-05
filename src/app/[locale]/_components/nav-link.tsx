'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LinkButton } from '@/components/ui/link-button'
import { afterOpen } from '@/hooks/use-after-open'
import { cn } from '@/lib/cn'

// Un enlace de la cabecera. La cabecera vive en el layout, que no sabe en qué pantalla está: esta
// hoja lo lee de la dirección y marca la actual con el subrayado grueso del `ghost`, quieto.
// Se precarga recién después de abrir (docs/07 §Presupuesto): con la precarga de `Link`, en un
// teléfono «Mis animales» y «Mi perfil» se bajaban mientras la pantalla todavía estaba abriendo.
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const current = usePathname() === href
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    void afterOpen().then(() => {
      if (isMounted) router.prefetch(href)
    })
    return () => {
      isMounted = false
    }
  }, [router, href])

  return (
    <LinkButton
      href={href}
      variant="ghost"
      aria-current={current ? 'page' : undefined}
      className={cn('text-base sm:text-lg', current && 'decoration-4')}
      prefetch={false}
    >
      {children}
    </LinkButton>
  )
}
