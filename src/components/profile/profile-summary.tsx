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
          {/* El sello en yerba y no en acento: ser rescatista es una señal de confianza, no un
              estado de proceso ni una urgencia (docs/10 §Color). */}
          {isRescuer ? <span className="sello mt-1 text-primary">{texts.rescuer}</span> : null}
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
