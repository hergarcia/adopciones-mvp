import { OpeningLink } from '@/components/ui/opening-link'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { VerificationBadge } from './verification-badge'

type Props = {
  level: BadgeLevel
  size?: 'md' | 'lg'
  /** A la explicación de los niveles, con este nivel marcado y la vuelta. */
  href: string
  /** Ya traducida: «Verificado, nivel 2. Qué significa». */
  label: string
}

// La chapita que se toca para preguntar qué vale la verificación. Sin prefetch: abrir la explicación
// se cuenta. Se hunde al apoyarla, también en el teléfono (`.sink`, salvo con «reducir movimiento»),
// y queda apagada desde que se suelta hasta que aparece la explicación, como la tarjeta de un animal
// (historia #350). La `md` dibuja 40 px de ancho; el enlace mide al menos los 44 del piso táctil.
export function VerificationBadgeLink({ level, size, href, label }: Props) {
  return (
    <OpeningLink
      href={href}
      prefetch={false}
      aria-label={label}
      className="sink mecer inline-grid min-h-11 min-w-11 shrink-0 place-items-center transition-[transform,opacity] duration-[var(--dur-fast)] ease-out"
    >
      <VerificationBadge level={level} size={size} label={null} />
    </OpeningLink>
  )
}
