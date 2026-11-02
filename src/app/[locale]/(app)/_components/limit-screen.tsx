import { getLocale, getTranslations } from 'next-intl/server'
import { LimitReached } from '@/components/applications/limit-reached'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { myApplicationPath } from '@/lib/applications/paths'
import type { ActiveApplication } from '@/lib/applications/types'
import type { PetPhotoData } from '@/lib/pets/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { withdrawTexts } from '@/app/[locale]/_components/application-texts'

// Las tres activas, contando las que esperan la identidad (historia #289), cada una con «Retirar»;
// al retirar, la misma ruta vuelve a decidir y, con lugar, muestra el cuestionario del animal desde
// el que llegó (FR-051).
export async function LimitScreen({
  name,
  cover,
  active,
}: {
  name: string
  cover: PetPhotoData | null
  active: ActiveApplication[]
}) {
  const [t, mine, locale] = await Promise.all([
    getTranslations('applications.limit'),
    getTranslations('applications.mine'),
    getLocale(),
  ])
  const rows = await Promise.all(
    active.map(async (application) => {
      const kind = application.held ? 'held' : 'application'
      const day = momentDayLabel(application.sentAt, locale)
      return {
        id: application.id,
        href: application.held ? null : myApplicationPath(application.id),
        cover: application.cover,
        stamp: application.held
          ? { tone: 'ink' as const, label: mine('stamps.waiting_identity') }
          : null,
        texts: {
          name: application.name,
          litter: application.litterName,
          photoAlt: mine('photo_alt', { name: application.name }),
          sentOn: application.held
            ? mine('written_on', { date: day })
            : mine('sent_on', { date: day }),
        },
        withdraw: (
          <WithdrawApplicationDialog
            id={application.id}
            doneHref={null}
            kind={kind}
            texts={await withdrawTexts(application.name, 'trigger_short', kind)}
          />
        ),
      }
    }),
  )
  return (
    <LimitReached
      cover={cover}
      texts={{
        title: t('title', { name }),
        body: t('body'),
        listLabel: t('list_label'),
        photoAlt: mine('photo_alt', { name }),
      }}
      rows={rows}
    />
  )
}
