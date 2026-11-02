import { getTranslations } from 'next-intl/server'
import { MyApplicationCard } from '@/components/applications/my-application-card'
import { WithdrawApplicationDialog } from '@/components/applications/withdraw-application-dialog'
import { myApplicationPath } from '@/lib/applications/paths'
import type { ApplicationSummary, HeldApplication } from '@/lib/applications/types'
import {
  applicationRowTexts,
  heldRowTexts,
  withdrawTexts,
} from '@/app/[locale]/_components/application-texts'

export type MyApplicationRow =
  { kind: 'application'; item: ApplicationSummary } | { kind: 'held'; item: HeldApplication }

function dayOf(row: MyApplicationRow): string {
  return row.kind === 'application' ? row.item.sentAt : row.item.writtenAt
}

// Las que se dejaron escritas van junto a las demás, ordenadas por el día en que se escribieron
// (FR-012); la base ya ordena cada lista, así que solo se intercalan.
export function newestFirst(
  applications: ApplicationSummary[],
  held: HeldApplication[],
): MyApplicationRow[] {
  return [
    ...applications.map((item): MyApplicationRow => ({ kind: 'application', item })),
    ...held.map((item): MyApplicationRow => ({ kind: 'held', item })),
  ].sort((a, b) => Date.parse(dayOf(b)) - Date.parse(dayOf(a)))
}

// Sin pantalla propia (FR-016): la card queda quieta y, mientras espera, «Retirar» va debajo.
async function heldCard(held: HeldApplication, index: number) {
  const { view, texts } = await heldRowTexts(held)
  const withdraw =
    held.status === 'waiting' ? (
      <WithdrawApplicationDialog
        id={held.id}
        doneHref={null}
        kind="held"
        texts={await withdrawTexts(held.petName, 'trigger_short', 'held')}
      />
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
