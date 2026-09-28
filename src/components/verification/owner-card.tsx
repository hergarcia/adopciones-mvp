import { Avatar } from '@/components/profile/avatar'
import { RescuerTag } from '@/components/profile/rescuer-tag'
import { Card } from '@/components/ui/card'
import { Stamp } from '@/components/ui/stamp'
import type { Publisher } from '@/lib/pets/types'

type Props = {
  publisher: Publisher
  /** Ya traducidos. `level` es null sin nivel: la ficha oculta que mira su propio publicador. */
  texts: { photoAlt: string; rescuer: string; level: string | null }
}

// La nota de quien lo pegó, sostenida con cinta (docs/10, `OwnerCard`): la persona y su nivel, que
// es lo que compra la confianza en tres segundos. Sin etiqueta encima: la nota con la persona y su
// sello ya dice qué es. Nunca la zona ni el contacto (FR-004), ni un enlace a otra pantalla (FR-007).
export function OwnerCard({ publisher, texts }: Props) {
  return (
    <Card taped className="flex items-start gap-4">
      <Avatar displayName={publisher.name} url={publisher.avatar} alt={texts.photoAlt} />
      <div className="flex min-w-0 flex-col items-start gap-2">
        <p className="text-base font-bold break-words text-ink">{publisher.name}</p>
        {publisher.isRescuer ? <RescuerTag label={texts.rescuer} /> : null}
        {texts.level === null ? null : <Stamp tone="primary">{texts.level}</Stamp>}
      </div>
    </Card>
  )
}
