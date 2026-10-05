import { getTranslations } from 'next-intl/server'
import { PublicErrorCopyProvider } from '@/app/[locale]/_components/public-error-copy'

// Los textos de los límites de error del listado viajan en el HTML y no con next-intl en el
// cliente, que la ficha y el listado no pueden pagar (docs/07 §Presupuesto, historia #95). La ficha
// los pisa con los suyos en su propio layout.
export default async function AnimalsLayout({ children }: { children: React.ReactNode }) {
  const [t, listing] = await Promise.all([
    getTranslations('common.error_screen'),
    getTranslations('pets.listing'),
  ])
  return (
    <PublicErrorCopyProvider
      copy={{ title: t('title'), body: listing('load_error'), retry: t('retry') }}
    >
      {children}
    </PublicErrorCopyProvider>
  )
}
