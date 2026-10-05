import { PersonRow } from '@/components/profile/person-list'
import type { MyBlock } from '@/lib/moderation/types'

type Props = {
  block: MyBlock
  /** Ya traducidos: el texto de la foto y «desde el 3 de octubre». */
  texts: { photoAlt: string; since: string }
  /** `UnblockButton`, que pone la página. */
  action: React.ReactNode
}

// Una persona de «Mis bloqueos», como una fila de «Mis avales»: su foto, el nombre que lleva al
// perfil bloqueado, desde cuándo y «Desbloquear».
export function MyBlockRow({ block, texts, action }: Props) {
  const person = { publicId: block.publicId, displayName: block.name, hasPhoto: block.hasPhoto }
  return (
    <PersonRow person={person} showPhoto photoAlt={texts.photoAlt}>
      <p className="text-sm text-ink-muted tabular-nums">{texts.since}</p>
      <div className="mt-1">{action}</div>
    </PersonRow>
  )
}
