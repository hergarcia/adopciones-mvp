import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { NotNowLink } from '@/components/verification/not-now-link'
import { NumberWithheldScreen } from '@/components/verification/number-withheld-screen'
import { SupportSentence } from '@/components/verification/support-sentence'
import { requireProfile } from '@/lib/auth/require-profile'
import { SUPPORT_EMAIL } from '@/lib/config'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { notNowDestination, parseGate, verifyPath, withheldPath } from '@/lib/verification/gate'
import { isLevelOne, phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ para?: string; next?: string; desde?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.number_withheld')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function NumberWithheldPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const gate = parseGate(await searchParams)
  await requireProfile(withheldPath(gate))

  const [t, screen, row] = await Promise.all([
    getTranslations('verification.withheld'),
    getTranslations('verification.screen'),
    getMyPhone(),
  ])
  const canContinue = gate.reason !== null && isLevelOne(phoneStatus(row, new Date()))

  return (
    <PageShell>
      <NumberWithheldScreen
        texts={{
          title: t('title'),
          lead: t('lead'),
          verifyOther: t('verify_other'),
          continue: t('continue'),
        }}
        help={<SupportSentence template={t('help', { email: '{email}' })} email={SUPPORT_EMAIL} />}
        verifyHref={verifyPath(gate)}
        continueTo={canContinue ? gate.next : null}
      />
      {gate.reason === null ? null : (
        <NotNowLink href={notNowDestination(gate)} label={screen('not_now')} />
      )}
    </PageShell>
  )
}
