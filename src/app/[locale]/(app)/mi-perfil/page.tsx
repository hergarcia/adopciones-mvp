import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { signOut } from '@/actions/auth'
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog'
import { ProfileSummary } from '@/components/profile/profile-summary'
import { SavedToast } from '@/components/profile/saved-toast'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { signAvatarUrl } from '@/lib/supabase/queries/avatars'
import { requireProfile } from '@/lib/auth/require-profile'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { departmentName } from '@/lib/zones/departments'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ guardado?: 'perfil' | 'cambios' }>
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
  const common = await getTranslations('common.showcase')

  // Firmada y de vida corta: la foto no queda accesible con una dirección adivinable (FR-026c).
  const avatarUrl = profile.avatarPath === null ? null : await signAvatarUrl(profile.avatarPath)

  const { guardado } = await searchParams

  return (
    <PageShell>
      {guardado ? (
        <SavedToast
          message={
            guardado === 'perfil'
              ? (await getTranslations('profile.complete'))('saved')
              : (await getTranslations('profile.edit'))('saved')
          }
          closeLabel={common('toast_close')}
          label={common('toast_label')}
          regionLabel={common('toast_region')}
        />
      ) : null}

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

      <LinkButton href="/mi-perfil/editar" variant="tirita" size="lg" className="mt-8 w-full">
        {t('edit')}
      </LinkButton>

      <div className="mt-8 flex flex-col items-start gap-2">
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            {t('sign_out')}
          </Button>
        </form>
        <DeleteAccountDialog
          texts={{
            trigger: t('delete'),
            title: del('title'),
            body: del('body'),
            confirm: del('confirm'),
            cancel: del('cancel'),
            close: common('toast_close'),
            failed: errors('delete_failed'),
          }}
        />
      </div>
    </PageShell>
  )
}
