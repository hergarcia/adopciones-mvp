import { getTranslations } from 'next-intl/server'
import { SavedToast } from '@/components/profile/saved-toast'
import { screenNotice } from '@/lib/verification/notice'
import type { PhoneStatus } from '@/lib/verification/phone-status'

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
  const toast = await getTranslations('common.toast')

  const message = {
    profile_saved: () => complete('saved'),
    profile_changes_saved: () => edit('saved'),
    phone_verified: () => t('verified'),
    cancelled_change: () =>
      t('cancelled_change', { number: notice.message === 'cancelled_change' ? notice.number : '' }),
    cancelled_first: () => t('cancelled_first'),
    cancel_failed: () => t('cancel_failed'),
  }[notice.message]()

  return (
    <SavedToast
      message={message}
      variant={notice.variant}
      closeLabel={toast('close')}
      label={toast('label')}
      regionLabel={toast('region')}
    />
  )
}
