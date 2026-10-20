'use client'

import { usePathname } from 'next/navigation'
import { LinkButton } from '@/components/ui/link-button'

type Props = {
  label: string
  className?: string
}

// En /entrar no va: llevaría a la pantalla en la que ya se está y perdería el `?next=` (KL-009).
export function SignInLink({ label, className }: Props) {
  if (usePathname() === '/entrar') return null
  return (
    <LinkButton href="/entrar" variant="secondary" size="sm" className={className}>
      {label}
    </LinkButton>
  )
}
