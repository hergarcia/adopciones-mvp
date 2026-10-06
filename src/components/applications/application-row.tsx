import Link from 'next/link'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'
import { ApplicationStamp } from './application-stamp'

type Props = {
  href: string
  cover: PetPhotoData | null
  tone: 'ink' | 'muted'
  /** Ya traducidos: el nombre, «Enviada el 6 de octubre», el sello y, de una cerrada, el motivo. */
  texts: { name: string; photoAlt: string; sentOn: string; stamp: string; reason: string | null }
}

// Una solicitud en la carpeta: la fila entera lleva a Mi solicitud (plan §Diseño).
export function ApplicationRow({ href, cover, tone, texts }: Props) {
  return (
    <li className="border-b-2 border-line">
      <Link
        href={href}
        className="flex items-start gap-4 py-3 transition-colors duration-[var(--dur-fast)] ease-out hover:bg-surface"
      >
        <ApplicationPetPhoto cover={cover} alt={texts.photoAlt} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <span className="text-base font-medium break-words text-ink">{texts.name}</span>
            <ApplicationStamp tone={tone} label={texts.stamp} />
          </div>
          <span className="text-xs text-ink-muted tabular-nums">{texts.sentOn}</span>
          {texts.reason === null ? null : (
            <span className="text-sm text-ink-muted">{texts.reason}</span>
          )}
        </div>
      </Link>
    </li>
  )
}
