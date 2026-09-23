import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CodeEntryScreen } from '@/components/verification/code-entry-screen'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import {
  codePath,
  codeScreen,
  notNowDestination,
  parseGate,
  verifyPath,
} from '@/lib/verification/gate'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import { hasPending, phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  codeAvailability,
  gateTexts,
  phoneCodeFormTexts,
} from '@/app/[locale]/_components/verification-texts'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ para?: string; next?: string; desde?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.phone_code')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function PhoneCodePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const query = await searchParams
  const gate = parseGate(query)
  const self = codePath(gate)
  const signIn = `/entrar?next=${encodeURIComponent(self)}`

  await requireProfile(self)
  const user = await getSessionUser()
  if (user === null) redirect(signIn)

  const status = phoneStatus(await getMyPhone(), new Date())
  const route = codeScreen(status, gate)
  if (!route.render) redirect(route.redirect)
  // `codeScreen` ya lo decidió; esto solo le dice al compilador que hay un número a medias.
  if (!hasPending(status)) redirect(verifyPath(gate))

  const t = await getTranslations('verification.code')
  const screen = await getTranslations('verification.screen')
  const reason = await gateTexts(gate.reason)

  return (
    <PageShell>
      <CodeEntryScreen
        number={formatPhoneNumber(status.number)}
        texts={{
          title: t('title'),
          sentTo: String(t.raw('sent_to')),
          correct: screen('correct_title'),
          notNow: screen('not_now'),
          reason: reason?.reason ?? null,
        }}
        formTexts={await phoneCodeFormTexts()}
        gate={query}
        available={await codeAvailability(user.id)}
        hrefs={{
          verify: verifyPath(gate),
          signIn,
          notNow: gate.reason === null ? null : notNowDestination(gate),
        }}
      />
    </PageShell>
  )
}
