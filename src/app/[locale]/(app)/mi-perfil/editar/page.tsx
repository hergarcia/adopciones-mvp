import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PersonalDataNotice } from '@/components/profile/personal-data-notice'
import { ProfileForm } from '@/components/profile/profile-form'
import { signAvatarUrl } from '@/lib/supabase/queries/avatars'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  departmentOptions,
  localitiesByDepartment,
  profileFormTexts,
} from '@/app/[locale]/_components/profile-form-texts'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.edit_profile')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// El mismo `ProfileForm` que «Completar perfil», en modo edición: dibujar un segundo formulario
// sería el mismo JSX dos veces (docs/08 §Regla de dos).
export default async function EditProfilePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await getMyProfile()
  if (profile === null) notFound()

  const t = await getTranslations('profile.edit')
  const notice = await getTranslations('profile.data_notice')
  const avatarUrl = profile.avatarPath === null ? null : await signAvatarUrl(profile.avatarPath)

  return (
    <PageShell>
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>

      <ProfileForm
        texts={await profileFormTexts('edit')}
        departments={departmentOptions()}
        localitiesByDepartment={localitiesByDepartment()}
        initial={{
          displayName: profile.displayName,
          department: profile.department,
          locality: profile.locality,
          isRescuer: profile.isRescuer,
          avatarUrl,
        }}
        next="/mi-perfil"
      />

      <div className="mt-6">
        <PersonalDataNotice
          stored={notice('stored')}
          emailPrivate={notice('email_private')}
          willBePublic={notice('will_be_public')}
        />
      </div>
    </PageShell>
  )
}
