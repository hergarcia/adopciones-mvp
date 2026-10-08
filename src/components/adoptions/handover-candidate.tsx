import { Avatar } from '@/components/profile/avatar'
import { VerificationBadge } from '@/components/verification/verification-badge'
import type { BadgeLevel } from '@/lib/verification/badge-parts'

type Props = {
  avatar: string | null
  level: 0 | BadgeLevel
  /** Ya traducidos: el nombre, el `alt` de la foto, la chapita en voz alta y cuándo se aceptó. */
  texts: { name: string; photoAlt: string; badge: string; acceptedOn: string | null }
}

// Una persona aceptada en «¿A quién se lo diste?» (plan §Marcar adoptado): la tirita que quedó en
// la mano, con su foto, su nombre y la chapita de hoy al frente. Es el texto de una opción del
// `RadioGroup`, así que no enlaza a nada: la chapita no lleva a la explicación.
export function HandoverCandidate({ avatar, level, texts }: Props) {
  return (
    <span className="flex items-center gap-4 py-2">
      <Avatar displayName={texts.name} url={avatar} alt={texts.photoAlt} lazy />
      <span className="flex min-w-0 flex-col gap-2">
        <span className="flex items-center gap-2">
          <span className="text-base font-medium break-words">{texts.name}</span>
          {level === 0 ? null : <VerificationBadge level={level} href={null} label={texts.badge} />}
        </span>
        {texts.acceptedOn === null ? null : <span className="text-sm">{texts.acceptedOn}</span>}
      </span>
    </span>
  )
}
