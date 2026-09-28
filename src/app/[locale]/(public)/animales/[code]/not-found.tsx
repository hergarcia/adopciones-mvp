import { getTranslations } from 'next-intl/server'
import { PetUnavailable } from '@/components/pets/pet-unavailable'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// «No está publicado»: un código que no existe, o el de una cuenta que se borró (FR-009). 404.
export default async function NotFound() {
  const t = await getTranslations('pets.page')
  return (
    <PageShell width="full">
      <PetUnavailable
        texts={{ title: t('missing_title'), body: t('missing_body'), toListing: t('to_listing') }}
      />
    </PageShell>
  )
}
