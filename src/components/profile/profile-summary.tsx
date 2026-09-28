import { Card } from '@/components/ui/card'
import { Avatar } from './avatar'
import { RescuerTag } from './rescuer-tag'

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
  /** La chapita del nivel de hoy, al lado del nombre; la arma quien sabe de verificación. */
  badge?: React.ReactNode
}

export function ProfileSummary({
  texts,
  displayName,
  zone,
  email,
  isRescuer,
  avatarUrl,
  badge,
}: Props) {
  return (
    <>
      <div className="flex items-start gap-4">
        <Avatar displayName={displayName} url={avatarUrl} alt={texts.photoAlt} size="lg" />
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <h1 className="afiche text-xl text-ink">{displayName}</h1>
            {badge}
          </div>
          <p className="text-base text-ink-muted">{zone}</p>
          {isRescuer ? (
            <span className="mt-1">
              <RescuerTag label={texts.rescuer} />
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
