import { getTranslations } from 'next-intl/server'
import { ProfileNotFound } from '@/components/profile/profile-not-found'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default async function NotFound() {
  const t = await getTranslations('profile.public')
  return (
    <PageShell width="full">
      <ProfileNotFound
        texts={{
          title: t('not_found_title'),
          body: t('not_found_body'),
          action: t('not_found_action'),
        }}
      />
    </PageShell>
  )
}
