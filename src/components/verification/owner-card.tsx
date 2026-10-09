import type { ReactNode } from 'react'
import { Avatar } from '@/components/profile/avatar'
import { RescuerTag } from '@/components/profile/rescuer-tag'
import { Card } from '@/components/ui/card'
import { Stamp } from '@/components/ui/stamp'
import { TextLink } from '@/components/ui/text-link'
import type { Publisher } from '@/lib/pets/types'

type Props = {
  publisher: Publisher
  /** Ya traducidos. `level` es null sin nivel: la ficha oculta que mira su propio publicador. */
  texts: { photoAlt: string; rescuer: string; level: string | null }
  /** Las adopciones con seguimiento que dio; la página lo llena (`components/follow-ups`). */
  history?: ReactNode
  /** La ficha de la persona, solo en Publicaciones por revisar (historia #73). */
  href?: string
}

// La nota de quien lo pegó, sostenida con cinta (docs/10, `OwnerCard`): la persona y su nivel, que
// es lo que compra la confianza en tres segundos. Sin etiqueta encima: la nota con la persona y su
// sello ya dice qué es. Nunca la zona ni el contacto (FR-004), ni un enlace a otra pantalla (FR-007):
// solo quien administra, en Publicaciones por revisar, llega por el nombre a la ficha de la persona.
export function OwnerCard({ publisher, texts, history, href }: Props) {
  return (
    <Card taped className="flex items-start gap-4">
      <Avatar displayName={publisher.name} url={publisher.avatar} alt={texts.photoAlt} />
      <div className="flex min-w-0 flex-col items-start gap-2">
        <div className="flex min-w-0 flex-col">
          <p className="text-base font-bold break-words text-ink">
            {href === undefined ? (
              publisher.name
            ) : (
              <TextLink href={href} placement="inline">
                {publisher.name}
              </TextLink>
            )}
          </p>
          {publisher.isRescuer ? <RescuerTag label={texts.rescuer} /> : null}
          {history}
        </div>
        {texts.level === null ? null : <Stamp tone="primary">{texts.level}</Stamp>}
      </div>
    </Card>
  )
}
