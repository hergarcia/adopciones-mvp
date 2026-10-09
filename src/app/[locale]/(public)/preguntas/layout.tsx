import { getTranslations } from 'next-intl/server'
import { LISTING_PATH } from '@/lib/pets/paths'
import { QUESTIONS_PATH } from '@/lib/questions/paths'
import { PublicErrorCopyProvider } from '@/app/[locale]/_components/public-error-copy'

export default async function QuestionsLayout({ children }: { children: React.ReactNode }) {
  const [t, error] = await Promise.all([
    getTranslations('common.error_screen'),
    getTranslations('questions.error'),
  ])
  return (
    <PublicErrorCopyProvider
      copy={{
        title: t('title'),
        body: error('body'),
        retry: t('retry'),
        exits: {
          index: { href: QUESTIONS_PATH, label: error('to_index') },
          listing: { href: LISTING_PATH, label: error('to_listing') },
        },
      }}
    >
      {children}
    </PublicErrorCopyProvider>
  )
}
