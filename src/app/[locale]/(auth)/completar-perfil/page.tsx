import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AccountActions } from '@/components/profile/account-actions'
import { PersonalDataNotice } from '@/components/profile/personal-data-notice'
import { ProfileForm } from '@/components/profile/profile-form'
import { safeDestination } from '@/lib/auth/next-destination'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  departmentOptions,
  localitiesByDepartment,
  profileFormTexts,
} from '@/app/[locale]/_components/profile-form-texts'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.complete_profile')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function CompleteProfilePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Exige sesión aunque viva en `(auth)`: edita datos personales (FR-013).
  if ((await getSessionUser()) === null) redirect('/entrar')
  // Con el perfil ya completo no hay nada que completar.
  if ((await getMyProfile()) !== null) redirect('/mi-perfil')

  const { next } = await searchParams
  const t = await getTranslations('profile.complete')
  const notice = await getTranslations('profile.data_notice')
  const view = await getTranslations('profile.view')
  const del = await getTranslations('profile.delete')

  return (
    <PageShell>
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <p className="mt-3 text-base text-ink-muted">{t('lead')}</p>

      <ProfileForm
        texts={await profileFormTexts('complete')}
        departments={departmentOptions()}
        localitiesByDepartment={localitiesByDepartment()}
        initial={{
          displayName: '',
          department: '',
          locality: '',
          isRescuer: false,
          avatarUrl: null,
        }}
        next={safeDestination(next)}
        draft
      />

      <div className="mt-6">
        <PersonalDataNotice
          stored={notice('stored')}
          emailPrivate={notice('email_private')}
          willBePublic={notice('will_be_public')}
        />
      </div>

      {/* La pantalla no puede ser una trampa: quien se arrepiente en el medio del alta ya tiene su
          dirección guardada y tiene que poder retirarla sin pedirle permiso a nadie (FR-016b). */}
      <AccountActions
        className="border-t-2 border-line pt-6"
        signOutLabel={view('sign_out')}
        deleteTexts={{
          trigger: view('delete'),
          title: del('title'),
          body: del('body'),
          confirm: del('confirm'),
          cancel: del('cancel'),
          close: (await getTranslations('common.toast'))('close'),
          failed: (await getTranslations('profile.errors'))('delete_failed'),
        }}
      />
    </PageShell>
  )
}
