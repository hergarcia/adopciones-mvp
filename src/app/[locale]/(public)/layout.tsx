import { getTranslations } from 'next-intl/server'
import { PaperFrame } from '@/app/[locale]/_components/paper-frame'
import { PublicErrorCopyProvider } from '@/app/[locale]/_components/public-error-copy'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common.error_screen')
  const profile = await getTranslations('profile.public')
  return (
    <PaperFrame size="wall">
      <PublicErrorCopyProvider
        copy={{ title: t('title'), body: profile('load_error'), retry: profile('retry') }}
      >
        {children}
      </PublicErrorCopyProvider>
    </PaperFrame>
  )
}
