import type { ReactNode } from 'react'
import { Avatar } from '@/components/profile/avatar'
import { TextLink } from '@/components/ui/text-link'
import { VerificationBadge } from '@/components/verification/verification-badge'
import type { BadgeLevel } from '@/lib/verification/badge-parts'

export type ApplicantHeaderProps = {
  avatar: string | null
  level: 0 | BadgeLevel
  /** A la explicación de los niveles. */
  levelsHref: string
  /** Al perfil público, desde donde se reporta o se bloquea (#13). */
  profileHref: string
  /** Ya traducidos: el nombre, la chapita en voz alta, «Nivel 1, Pocitos» y «Ver su perfil». */
  texts: { name: string; photoAlt: string; badge: string; who: string; profile: string }
  /** Las adopciones con seguimiento que adoptó; la página lo llena (`components/follow-ups`). */
  history?: ReactNode
}

// Arriba de una solicitud, para el publicador (plan §Diseño): quién es, con la chapita grande al
// lado del nombre —la ficha de la entrevista empieza por quién responde por esa persona—, el nivel
// y la zona, y el camino a su perfil.
export function ApplicantHeader({
  avatar,
  level,
  levelsHref,
  profileHref,
  texts,
  history,
}: ApplicantHeaderProps) {
  return (
    <header className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        <Avatar displayName={texts.name} url={avatar} alt={texts.photoAlt} size="lg" />
        {level === 0 ? null : (
          <VerificationBadge level={level} size="lg" href={levelsHref} label={texts.badge} />
        )}
      </div>
      <h1 className="afiche text-2xl break-words text-ink">{texts.name}</h1>
      <p className="text-sm text-ink-muted">{texts.who}</p>
      {history}
      <TextLink href={profileHref} prefetch={false}>
        {texts.profile}
      </TextLink>
    </header>
  )
}
