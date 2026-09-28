import { getTranslations } from 'next-intl/server'
import { ScreenToast } from '@/app/[locale]/(app)/_components/screen-toast'
import { REVIEW_SAVED_FLAG } from '@/lib/verification/review-saved'

const MESSAGES = {
  [REVIEW_SAVED_FLAG.approve]: 'approved_toast',
  [REVIEW_SAVED_FLAG.reject]: 'rejected_toast',
} as const

// Que la resolución se guardó, con el verbo del botón, en la pantalla a la que se llega: el
// siguiente pedido o la lista (FR-018). Sin él, pasar al siguiente se ve igual que no haber guardado.
export async function ReviewNotice({ flag }: { flag: string | undefined }) {
  if (flag !== REVIEW_SAVED_FLAG.approve && flag !== REVIEW_SAVED_FLAG.reject) return null
  const t = await getTranslations('review.request')
  return <ScreenToast message={t(MESSAGES[flag])} />
}
