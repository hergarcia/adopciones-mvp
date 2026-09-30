import Link from 'next/link'
import { cn } from '@/lib/cn'
import { button } from './button'

type Props = {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'ghost-danger' | 'danger' | 'tirita'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  ref?: React.Ref<HTMLAnchorElement>
  /** La pantalla en la que ya se está: la cabecera la marca para un lector de pantalla. */
  'aria-current'?: 'page'
  /** `false` donde abrir la página registra algo: traerla por adelantado lo contaría. */
  prefetch?: boolean
}

// Una acción que navega es un enlace, no un botón: meter un `button` adentro de un `a` es HTML
// inválido y le da a un lector de pantalla dos controles anidados (docs/10 §Piso de
// accesibilidad). Comparte las variantes de `Button`, así que ningún enlace las redibuja a mano.
export function LinkButton({
  href,
  children,
  variant,
  size,
  className,
  ref,
  'aria-current': current,
  prefetch,
}: Props) {
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={current}
      prefetch={prefetch}
      className={cn(button({ variant, size }), className)}
    >
      {children}
    </Link>
  )
}
