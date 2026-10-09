import { getLocale, getTranslations } from 'next-intl/server'
import { LimitReached } from '@/components/applications/limit-reached'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { myApplicationPath } from '@/lib/applications/paths'
import type { ActiveApplication } from '@/lib/applications/types'
import type { PetPhotoData } from '@/lib/pets/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { withdrawTexts } from '@/app/[locale]/_components/application-texts'

// Las tres activas, cada una con «Retirar»; al retirar, la misma ruta vuelve a decidir y, con lugar,
// muestra el cuestionario del animal desde el que llegó (FR-051).
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
    active.map(async (application) => ({
      id: application.id,
      href: myApplicationPath(application.id),
      cover: application.cover,
      texts: {
        name: application.name,
        photoAlt: mine('photo_alt', { name: application.name }),
        sentOn: mine('sent_on', { date: momentDayLabel(application.sentAt, locale) }),
      },
      withdraw: (
        <WithdrawApplicationDialog
          id={application.id}
          doneHref={null}
          texts={await withdrawTexts(application.name, 'trigger_short')}
        />
      ),
    })),
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
