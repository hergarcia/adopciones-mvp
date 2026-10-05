import { getTranslations } from 'next-intl/server'
import { PublicErrorCopyProvider } from '@/app/[locale]/_components/public-error-copy'

export default async function PetLayout({ children }: { children: React.ReactNode }) {
  const [t, page] = await Promise.all([
    getTranslations('common.error_screen'),
    getTranslations('pets.page'),
  ])
  return (
    <PublicErrorCopyProvider
      copy={{
        title: t('title'),
        body: page('load_error'),
        retry: t('retry'),
        toListing: page('to_listing'),
      }}
    >
      {children}
    </PublicErrorCopyProvider>
  )
}
