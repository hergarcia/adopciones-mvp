import { VerificationBadge } from '@/components/verification/verification-badge'
import { levelsPath } from '@/lib/profile/public-paths'
import type { VerificationLevel } from '@/lib/verification/level'
import { badgeLabel } from './level-texts'

type Props = {
  level: VerificationLevel
  size?: 'md' | 'lg'
  /** La pantalla a la que vuelve la explicación. */
  from: string
}

// La chapita de la propia persona, la misma que ven los demás en su perfil público (FR-003), en
// «Mi perfil» y en la verificación aprobada. Sin nivel no hay chapita: la pantalla sigue diciendo
// el paso pendiente.
export async function MyBadge({ level, size = 'md', from }: Props) {
  if (level === 0) return null
  return (
    <VerificationBadge
      level={level}
      size={size}
      href={levelsPath(level, from)}
      label={await badgeLabel(level, true)}
    />
  )
}
