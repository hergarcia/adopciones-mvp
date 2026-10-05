import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AccountActions } from '@/components/profile/account-actions'
import { SuspendedScreen } from '@/components/moderation/suspended-screen'
import { SupportSentence } from '@/components/verification/support-sentence'
import { SUPPORT_EMAIL } from '@/lib/config'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { suspendedScreenGate } from '@/lib/moderation/standing-gate'
import { getAccountStanding } from '@/lib/supabase/queries/moderation'
import { lookupSession } from '@/lib/supabase/queries/session'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.suspended_screen')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Lo inverso de la puerta (research R4): sin sesión, a ingresar; activa, a «Mi perfil»; si no se
// pudo preguntar, el error con «Reintentar», que vuelve a preguntar. La sesión se lee sin puerta:
// esta es la pantalla a la que la puerta manda.
export default async function SuspendedAccountPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { user } = await lookupSession()
  const verdict = suspendedScreenGate(user === null ? null : await getAccountStanding())
  if (verdict.kind === 'redirect') redirect(verdict.to)
  if (verdict.kind === 'error') throw new Error('No se pudo saber cómo está la cuenta')

  const [t, view, del, errors, toast] = await Promise.all([
    getTranslations('moderation.suspended_screen'),
    getTranslations('profile.view'),
    getTranslations('profile.delete'),
    getTranslations('profile.errors'),
    getTranslations('common.toast'),
  ])
  const reports = await getTranslations('moderation.reports')

  return (
    <PageShell>
      <SuspendedScreen
        texts={{
          title: t('title'),
          since: t('since', { date: momentDayLabel(verdict.since, locale) }),
          reasonLabel: t('reason_label'),
        }}
        reason={reports('quote', { text: verdict.reason })}
        help={<SupportSentence template={t('help', { email: '{email}' })} email={SUPPORT_EMAIL} />}
        actions={
          <AccountActions
            signOutLabel={view('sign_out')}
            deleteTexts={{
              trigger: view('delete'),
              title: del('title'),
              body: del('body'),
              confirm: del('confirm'),
              cancel: del('cancel'),
              close: toast('close'),
              failed: errors('delete_failed'),
            }}
          />
        }
      />
    </PageShell>
  )
}
