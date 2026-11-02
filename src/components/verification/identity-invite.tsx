import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { IdentityInviteFrame, IdentityInviteNotNow } from './identity-invite-frame'

export type IdentityInviteTexts = {
  title: string
  /** Qué cambia, con «Identidad verificada» ya envuelto en `VerifiedWords`. */
  change: React.ReactNode
  places: string[]
  photos: string
  verify: string
  notNow: string
}

type Props = {
  texts: IdentityInviteTexts
  href: string
  /** El `h1` de la pantalla, que recibe el foco al cerrar la nota. */
  focusId: string
}

const TITLE_ID = 'invitacion-identidad'

/** Las palabras del nivel en el verde de lo verificado, como `PublisherLevelLine`. */
export function VerifiedWords({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-primary">{children}</span>
}

// La invitación a verificar la identidad en «Mis animales» (historia #281). La cinta es su único
// gesto y la acción va en `secondary`: la tirita de la pantalla sigue siendo «Publicar un animal».
// Desde 1024, dos columnas iguales: a la izquierda el título, las fotos y las acciones; a la derecha
// qué cambia y dónde. El orden del HTML es el del teléfono, así que las filas de la izquierda se
// apilan arriba y la última se queda con el alto que sobra.
export function IdentityInvite({ texts, href, focusId }: Props) {
  return (
    <IdentityInviteFrame focusId={focusId}>
      <section aria-labelledby={TITLE_ID}>
        <Card
          taped
          className="grid gap-y-4 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr] lg:gap-x-16 lg:p-8"
        >
          <h2
            id={TITLE_ID}
            className="afiche max-w-[var(--measure)] text-xl text-ink lg:col-start-1"
          >
            {texts.title}
          </h2>
          <div className="max-w-[var(--measure)] text-base text-ink lg:col-start-2 lg:row-span-3 lg:row-start-1">
            <p>{texts.change}</p>
            <ul className="mt-2 list-disc pl-5 marker:text-ink">
              {texts.places.map((place) => (
                <li key={place}>{place}</li>
              ))}
            </ul>
          </div>
          <p className="max-w-[var(--measure)] text-sm text-ink-muted lg:col-start-1">
            {texts.photos}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 lg:col-start-1 lg:self-start">
            <LinkButton href={href} variant="secondary" size="md" className="w-full sm:w-auto">
              {texts.verify}
            </LinkButton>
            <IdentityInviteNotNow label={texts.notNow} />
          </div>
        </Card>
      </section>
    </IdentityInviteFrame>
  )
}
