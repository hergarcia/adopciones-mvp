import { Card } from '@/components/ui/card'
import { Avatar } from './avatar'

export type SummaryTexts = {
  emailLabel: string
  emailOnlyYou: string
  rescuer: string
  photoAlt: string
}

type Props = {
  texts: SummaryTexts
  displayName: string
  zone: string
  email: string
  isRescuer: boolean
  avatarUrl: string | null
}

export function ProfileSummary({ texts, displayName, zone, email, isRescuer, avatarUrl }: Props) {
  return (
    <>
      <div className="flex items-start gap-4">
        <Avatar displayName={displayName} url={avatarUrl} alt={texts.photoAlt} size="lg" />
        <div className="flex flex-col items-start gap-1">
          <h1 className="afiche text-xl text-ink">{displayName}</h1>
          <p className="text-base text-ink-muted">{zone}</p>
          {/* Etiqueta informativa y no un sello: el sello marca un **estado** y ser rescatista es
              un atributo que no cambia solo. Tampoco va en yerba: el verde y la prominencia son
              de la chapita de verificación, que llega en la historia #12 y tiene que seguir
              siendo lo único que resalte (docs/10 §Principios 2, §Recursos). */}
          {isRescuer ? (
            <span className="mt-1 border-2 border-ink px-2 py-0.5 text-sm text-ink">
              {texts.rescuer}
            </span>
          ) : null}
        </div>
      </div>

      <Card className="mt-6">
        <p className="text-sm text-ink-muted">{texts.emailLabel}</p>
        <p className="mt-1 text-base text-ink">{email}</p>
        <p className="mt-2 text-sm text-primary">{texts.emailOnlyYou}</p>
      </Card>
    </>
  )
}
