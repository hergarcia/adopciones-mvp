import { getTranslations } from 'next-intl/server'
import { PublicErrorCopyProvider } from '@/app/[locale]/_components/public-error-copy'

export default async function LitterLayout({ children }: { children: React.ReactNode }) {
  const [t, page, pets] = await Promise.all([
    getTranslations('common.error_screen'),
    getTranslations('litters.page'),
    getTranslations('pets.page'),
  ])
  return (
    <PublicErrorCopyProvider
      copy={{
        title: t('title'),
        body: page('load_error'),
        retry: t('retry'),
        toListing: pets('to_listing'),
      }}
    >
      {children}
    </PublicErrorCopyProvider>
  )
}
