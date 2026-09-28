import { PersonRow } from '@/components/profile/person-list'
import type { MyVouch } from '@/lib/vouches/types'
import { VouchPausedNote } from './vouch-paused-note'

type Props = {
  vouch: MyVouch
  /** Ya traducidos. */
  texts: { photoAlt: string; since: string; paused: string | null }
  /** Retirar o quitar: la hoja cliente de la fila. */
  action: React.ReactNode
}

// Una persona de «Mis avales»: desde cuándo, si el aval está en pausa y la acción.
export function MyVouchRow({ vouch, texts, action }: Props) {
  const person = {
    publicId: vouch.otherPublicId,
    displayName: vouch.otherDisplayName,
    hasPhoto: vouch.otherHasPhoto,
  }
  return (
    <PersonRow person={person} showPhoto photoAlt={texts.photoAlt}>
      <p className="text-sm text-ink-muted tabular-nums">{texts.since}</p>
      {texts.paused === null ? null : <VouchPausedNote text={texts.paused} />}
      {action}
    </PersonRow>
  )
}
