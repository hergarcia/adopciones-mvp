import Link from 'next/link'
import { Avatar } from '@/components/profile/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { rowLinkTitle } from '@/components/ui/text-link'
import { VerificationBadge } from '@/components/verification/verification-badge'
import type { ApplicationTone } from '@/lib/applications/application-view'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { cn } from '@/lib/cn'
import { ApplicationStamp } from './application-stamp'

type Props = {
  href: string
  /** La foto de su perfil público, o null: las iniciales. */
  avatar: string | null
  /** El nivel de hoy; 0 sin chapita. */
  level: 0 | BadgeLevel
  tone: ApplicationTone
  /**
   * Ya traducidos: el nombre, la chapita en voz alta, «Nivel 1, Pocitos», las tres respuestas clave
   * en palabras, «Llegó el 3 de octubre, hace 4 días» y el sello.
   */
  texts: {
    name: string
    photoAlt: string
    badge: string
    who: string
    answers: string[]
    arrived: string
    stamp: string
  }
}

const ROW = 'flex items-start gap-4 border-b-2 border-line py-4'

// Una persona en la carpeta de fichas de un animal (docs/10, `ApplicationCard`): la chapita al
// frente, que es lo que la rescatista mira primero, tres respuestas para comparar de un vistazo y el
// sello a la derecha. El renglón entero es el enlace, sin caja: es una carpeta, no una pared. La
// chapita no enlaza, porque iría un enlace dentro de otro. Sin prefetch: abrirla la da por vista.
export function ApplicationCard({ href, avatar, level, tone, texts }: Props) {
  return (
    <li>
      <Link href={href} prefetch={false} className={`press group ${ROW}`}>
        <Avatar displayName={texts.name} url={avatar} alt={texts.photoAlt} lazy />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className={cn(rowLinkTitle(), 'text-base font-bold break-words')}>{texts.name}</p>
            <ApplicationStamp tone={tone} label={texts.stamp} />
          </div>
          <div className="flex items-center gap-2">
            {level === 0 ? null : (
              <VerificationBadge level={level} size="md" href={null} label={texts.badge} />
            )}
            <p className="text-sm text-ink-muted">{texts.who}</p>
          </div>
          <ul className="flex flex-col text-sm text-ink">
            {texts.answers.map((answer) => (
              <li key={answer}>{answer}</li>
            ))}
          </ul>
          <p className="text-sm text-ink-muted tabular-nums">{texts.arrived}</p>
        </div>
      </Link>
    </li>
  )
}

export function ApplicationCardSkeleton() {
  return (
    <li className={ROW}>
      <Skeleton className="size-12" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full max-w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
    </li>
  )
}
