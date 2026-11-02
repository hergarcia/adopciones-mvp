import { getTranslations } from 'next-intl/server'
import { MyApplicationCard } from '@/components/applications/my-application-card'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { TextLink } from '@/components/ui/text-link'
import { myApplicationPath } from '@/lib/applications/paths'
import { IDENTITY_PATH } from '@/lib/verification/paths'
import type { MyApplicationRow } from '@/lib/applications/held-view'
import type { HeldApplication } from '@/lib/applications/types'
import {
  applicationRowTexts,
  heldRowTexts,
  withdrawTexts,
} from '@/app/[locale]/_components/application-texts'

// Sin pantalla propia (FR-016): la card queda quieta y, mientras espera, «Retirar» va debajo; si ya
// no hay pedido en revisión, antes va el camino a mandar las fotos de nuevo (FR-013).
async function heldCard(held: HeldApplication, index: number) {
  const { view, texts, verify } = await heldRowTexts(held)
  const withdraw =
    held.status === 'waiting' ? (
      <>
        {verify === null ? null : (
          <TextLink href={IDENTITY_PATH} weight="medium" className="text-sm">
            {verify}
          </TextLink>
        )}
        <WithdrawApplicationDialog
          id={held.id}
          doneHref={null}
          kind="held"
          texts={await withdrawTexts(held.petName, 'trigger_short', 'held')}
        />
      </>
    ) : null
  return (
    <MyApplicationCard
      key={held.id}
      href={null}
      cover={held.cover}
      index={index}
      tone={view.tone}
      texts={texts}
      below={withdraw}
    />
  )
}

/** Las cards de un grupo de Mis solicitudes, en el orden que llegan. */
export async function myApplicationRows(
  rows: MyApplicationRow[],
  openFollowUps: ReadonlySet<string>,
) {
  const t = await getTranslations('applications.mine')
  return Promise.all(
    rows.map(async (row, index) => {
      if (row.kind === 'held') return heldCard(row.item, index)
      const application = row.item
      const { view, texts } = await applicationRowTexts(application)
      // El pedido del seguimiento lleva a Mi solicitud, como la card entera (historia #69).
      const followUp = openFollowUps.has(application.id) ? t('follow_up_cta') : null
      return (
        <MyApplicationCard
          key={application.id}
          href={myApplicationPath(application.id)}
          cover={application.cover}
          index={index}
          tone={view.tone}
          texts={{ ...texts, followUp }}
        />
      )
    }),
  )
}
