import { getTranslations } from 'next-intl/server'
import { PublicErrorCopyProvider } from '@/app/[locale]/_components/public-error-copy'

// Sin esto, la falla hablaría del perfil, que es el texto por defecto de la zona pública.
export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  const [t, error] = await Promise.all([
    getTranslations('common.error_screen'),
    getTranslations('about.error'),
  ])
  return (
    <PublicErrorCopyProvider
      copy={{
        title: t('title'),
        body: error('body'),
        retry: t('retry'),
        exit: { href: '/', label: error('to_home') },
      }}
    >
      {children}
    </PublicErrorCopyProvider>
  )
}
