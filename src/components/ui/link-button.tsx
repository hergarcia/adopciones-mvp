import Link from 'next/link'
import { cn } from '@/lib/cn'
import { button } from './button'

type Props = {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'ghost-danger' | 'danger' | 'tirita'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Una acción que navega es un enlace, no un botón: meter un `button` adentro de un `a` es HTML
// inválido y le da a un lector de pantalla dos controles anidados (docs/10 §Piso de
// accesibilidad). Comparte las variantes de `Button`, así que ningún enlace las redibuja a mano.
export function LinkButton({ href, children, variant, size, className }: Props) {
  return (
    <Link href={href} className={cn(button({ variant, size }), className)}>
      {children}
    </Link>
  )
}
