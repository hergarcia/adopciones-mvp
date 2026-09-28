import { getTranslations } from 'next-intl/server'
import { screenNotice } from '@/lib/verification/notice'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { ScreenToast } from './screen-toast'

type Props = {
  flags: { guardado?: string; error?: string }
  status: PhoneStatus
}

export async function PhoneNotice({ flags, status }: Props) {
  const notice = screenNotice(flags, status)
  if (notice === null) return null

  const t = await getTranslations('verification.notice')
  const complete = await getTranslations('profile.complete')
  const edit = await getTranslations('profile.edit')

  const message = {
    profile_saved: () => complete('saved'),
    profile_changes_saved: () => edit('saved'),
    phone_verified: () => t('verified'),
    cancelled_change: () =>
      t('cancelled_change', { number: notice.message === 'cancelled_change' ? notice.number : '' }),
    cancelled_first: () => t('cancelled_first'),
    cancel_failed: () => t('cancel_failed'),
    sign_out_failed: () => t('sign_out_failed'),
  }[notice.message]()

  return <ScreenToast message={message} variant={notice.variant} />
}
