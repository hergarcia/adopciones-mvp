'use client'

import { usePathname } from 'next/navigation'

// Sin la consulta: «Administrar» lleva `?desde=menu` para medir de dónde se llegó.
export function useIsCurrentPath(href: string): boolean {
  return usePathname() === href.split('?')[0]
}
