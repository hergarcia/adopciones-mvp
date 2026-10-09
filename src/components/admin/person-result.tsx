import Link from 'next/link'
import { Avatar } from '@/components/profile/avatar'
import { Stamp } from '@/components/ui/stamp'
import { rowLinkTitle } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'

type Props = {
  href: string
  /** Ya traducidos. */
  name: string
  avatar: { url: string | null; alt: string }
  /** «Pocitos, Montevideo», o que no tiene zona. */
  zone: string
  /** «Suspendida», solo si lo está (FR-052). */
  suspended: string | null
}

// Una persona encontrada: la foto, el nombre y la zona, y el sello si está suspendida. El renglón
// entero lleva a su ficha.
export function PersonResult({ href, name, avatar, zone, suspended }: Props) {
  return (
    <Link href={href} className="press group flex items-center gap-4 py-6">
      <Avatar displayName={name} url={avatar.url} alt={avatar.alt} lazy />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className={cn(rowLinkTitle(), 'text-base font-medium break-words')}>{name}</span>
          {suspended === null ? null : <Stamp tone="muted">{suspended}</Stamp>}
        </span>
        <span className="text-sm text-ink-muted">{zone}</span>
      </span>
    </Link>
  )
}
