import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AccountActions } from '@/components/profile/account-actions'
import { ProfileSummary } from '@/components/profile/profile-summary'
import { PhoneStatusCard } from '@/components/verification/phone-status-card'
import { LinkButton } from '@/components/ui/link-button'
import { signAvatarUrl } from '@/lib/supabase/queries/avatars'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { NO_GATE, codePath, verifyPath } from '@/lib/verification/gate'
import { phoneStatus } from '@/lib/verification/phone-status'
import { departmentName } from '@/lib/zones/departments'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { statusCardTexts } from '@/app/[locale]/_components/verification-texts'
import { PhoneNotice } from '@/app/[locale]/(app)/_components/phone-notice'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ guardado?: string; error?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.my_profile')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function MyProfilePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await requireProfile('/mi-perfil')
  const user = await getSessionUser()
  if (user === null) notFound()

  const t = await getTranslations('profile.view')
  const form = await getTranslations('profile.form')
  const del = await getTranslations('profile.delete')
  const errors = await getTranslations('profile.errors')

  // Firmada y de vida corta: la foto no queda accesible con una dirección adivinable (FR-026c).
  const [avatarUrl, phoneRow] = await Promise.all([
    profile.avatarPath === null ? null : signAvatarUrl(profile.avatarPath),
    getMyPhone(),
  ])
  const phone = phoneStatus(phoneRow, new Date())

  return (
    <PageShell>
      <PhoneNotice flags={await searchParams} status={phone} />

      <ProfileSummary
        texts={{
          emailLabel: t('email_label'),
          emailOnlyYou: t('email_only_you'),
          rescuer: t('rescuer'),
          photoAlt: form('photo_alt'),
        }}
        displayName={profile.displayName}
        zone={`${profile.locality}, ${departmentName(profile.department)}`}
        email={user.email}
        isRescuer={profile.isRescuer}
        avatarUrl={avatarUrl}
      />

      <div className="mt-6">
        <PhoneStatusCard
          status={phone}
          texts={await statusCardTexts(phone)}
          hrefs={{ verify: verifyPath(NO_GATE), code: codePath(NO_GATE), self: '/mi-perfil' }}
        />
      </div>

      <LinkButton href="/mi-perfil/editar" variant="tirita" size="lg" className="mt-8 w-full">
        {t('edit')}
      </LinkButton>

      <AccountActions
        signOutLabel={t('sign_out')}
        deleteTexts={{
          trigger: t('delete'),
          title: del('title'),
          body: del('body'),
          confirm: del('confirm'),
          cancel: del('cancel'),
          close: (await getTranslations('common.toast'))('close'),
          failed: errors('delete_failed'),
        }}
      />
    </PageShell>
  )
}
