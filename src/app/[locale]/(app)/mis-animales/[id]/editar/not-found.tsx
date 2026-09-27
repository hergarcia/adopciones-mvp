import { getTranslations } from 'next-intl/server'
import { PetNotFound } from '@/components/pets/pet-not-found'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default async function NotFound() {
  const t = await getTranslations('pets.not_found')
  return (
    <PageShell>
      <PetNotFound texts={{ title: t('title'), body: t('body'), action: t('action') }} />
    </PageShell>
  )
}
