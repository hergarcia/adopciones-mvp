import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AccountActions } from '@/components/profile/account-actions'
import { DiscardProfileDraft } from '@/components/profile/discard-profile-draft'
import { ProfileSummary } from '@/components/profile/profile-summary'
import { LinkButton } from '@/components/ui/link-button'
import { signAvatarUrl } from '@/lib/supabase/queries/avatars'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { listMyVouches } from '@/lib/supabase/queries/vouches'
import { lostNotice } from '@/lib/verification/lost-notice'
import { myVerification } from '@/lib/verification/level'
import { countingReceived } from '@/lib/vouches/my-vouches'
import { zoneName } from '@/lib/zones/zone-name'
import { MyBadge } from '@/app/[locale]/_components/my-badge'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { IdentityNotice } from '@/app/[locale]/(app)/_components/identity-notice'
import { PhoneNotice } from '@/app/[locale]/(app)/_components/phone-notice'
import { VerificationSections } from './_components/verification-sections'

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
  const [avatarUrl, phoneRow, identityRecord, vouches] = await Promise.all([
    profile.avatarPath === null ? null : signAvatarUrl(profile.avatarPath),
    getMyPhone(),
    getMyIdentity(),
    listMyVouches(user.id),
  ])
  const { phone, identity, level } = myVerification(
    { phone: phoneRow, identity: identityRecord, countingVouches: countingReceived(vouches) },
    new Date(),
  )

  const flags = await searchParams

  return (
    <PageShell>
      <DiscardProfileDraft />
      <PhoneNotice flags={flags} status={phone} />
      <IdentityNotice flags={flags} />

      <ProfileSummary
        texts={{
          emailLabel: t('email_label'),
          emailOnlyYou: t('email_only_you'),
          rescuer: t('rescuer'),
          photoAlt: form('photo_alt'),
        }}
        displayName={profile.displayName}
        zone={zoneName(profile)}
        email={user.email}
        isRescuer={profile.isRescuer}
        avatarUrl={avatarUrl}
        badge={<MyBadge level={level} from="/mi-perfil" />}
      />

      <VerificationSections
        phone={phone}
        lostOn={lostNotice(phoneRow)?.lostOn ?? null}
        identity={identity}
        level={level}
        publicId={profile.publicId}
        vouches={vouches}
      />

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
