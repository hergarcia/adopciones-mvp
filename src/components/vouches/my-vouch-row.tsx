import Link from 'next/link'
import { Avatar } from '@/components/profile/avatar'
import { VouchPausedNote } from './vouch-paused-note'

type Props = {
  name: string
  profileHref: string
  /** La ruta propia de la foto, o nulo sin foto: las iniciales. */
  photoUrl: string | null
  /** Ya traducidos. */
  texts: { photoAlt: string; since: string; paused: string | null }
  /** Retirar o quitar: la hoja cliente de la fila. */
  action: React.ReactNode
}

// Una persona de «Mis avales»: quién es, desde cuándo, si el aval está en pausa y la acción. Sin
// prefetch en el nombre: traer el perfil por adelantado contaría como una vista (research R10).
export function MyVouchRow({ name, profileHref, photoUrl, texts, action }: Props) {
  return (
    <li className="flex items-start gap-4 py-4">
      <Avatar displayName={name} url={photoUrl} alt={texts.photoAlt} />
      <div className="flex flex-col items-start gap-1">
        <Link
          href={profileHref}
          prefetch={false}
          className="press text-base font-medium text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
        >
          {name}
        </Link>
        <p className="text-sm text-ink-muted tabular-nums">{texts.since}</p>
        {texts.paused === null ? null : <VouchPausedNote text={texts.paused} />}
        {action}
      </div>
    </li>
  )
}
