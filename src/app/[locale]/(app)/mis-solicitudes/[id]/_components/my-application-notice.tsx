import { getTranslations } from 'next-intl/server'
import { COMMITTED_FLAG, DECLINED_FLAG } from '@/lib/adoptions/paths'
import { ANSWERED_FLAG } from '@/lib/applications/paths'
import type { FollowUpView } from '@/lib/follow-ups/follow-up-view'
import { FOLLOW_UP_CLOSED_FLAG, FOLLOW_UP_SENT_FLAG } from '@/lib/follow-ups/paths'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

export type MyApplicationFlags = {
  [ANSWERED_FLAG]?: string
  [COMMITTED_FLAG]?: string
  [DECLINED_FLAG]?: string
  [FOLLOW_UP_SENT_FLAG]?: string
  [FOLLOW_UP_CLOSED_FLAG]?: string
}

type Props = {
  flags: MyApplicationFlags
  state: {
    hasPendingQuestion: boolean
    isCommitmentAccepted: boolean
    followUpKind: FollowUpView['kind']
    isClosedAsAdopted: boolean
  }
  names: { pet: string; publisher: string }
}

// Cada aviso sale solo si la pantalla ya muestra lo que dice: un enlace viejo con la marca no
// anuncia algo que no pasó.
export async function MyApplicationNotice({ flags, state, names }: Props) {
  const name = names.pet
  const publisher = names.publisher
  const notices: (() => Promise<string>)[] = []
  if (flags[ANSWERED_FLAG] === '1' && !state.hasPendingQuestion)
    notices.push(async () => (await getTranslations('applications.answer'))('done'))
  if (flags[COMMITTED_FLAG] === '1' && state.isCommitmentAccepted)
    notices.push(async () => (await getTranslations('adoptions.commitment'))('accepted_done'))
  if (flags[FOLLOW_UP_SENT_FLAG] === '1' && state.followUpKind === 'answer')
    notices.push(async () =>
      (await getTranslations('follow_ups.toast'))('sent', { name, publisher }),
    )
  if (flags[FOLLOW_UP_CLOSED_FLAG] === '1' && state.followUpKind !== 'form')
    notices.push(async () => (await getTranslations('follow_ups.errors'))('closed', { name }))
  if (flags[DECLINED_FLAG] === '1' && state.isClosedAsAdopted)
    notices.push(async () =>
      (await getTranslations('adoptions.decline'))('done', { name, publisher }),
    )

  const messages = await Promise.all(notices.map((message) => message()))
  return messages.map((message) => <ScreenToast key={message} message={message} />)
}
