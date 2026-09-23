import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { VerifyPhoneScreen } from '@/components/verification/verify-phone-screen'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import {
  codePath,
  gateScreen,
  notNowDestination,
  parseGate,
  verifyPath,
} from '@/lib/verification/gate'
import { phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  codeAvailability,
  phoneNumberFormTexts,
  verifyScreenTexts,
} from '@/app/[locale]/_components/verification-texts'
import { PhoneNotice } from '@/app/[locale]/(app)/_components/phone-notice'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    para?: string
    next?: string
    desde?: string
    guardado?: string
    error?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.verify_phone')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function VerifyPhonePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const query = await searchParams
  const gate = parseGate(query)
  const self = verifyPath(gate)
  const signIn = `/entrar?next=${encodeURIComponent(self)}`

  // Su propia URL con la puerta entera: así la acción, el destino y el origen sobreviven a
  // ingresar y a completar el perfil (FR-013c).
  await requireProfile(self)
  const user = await getSessionUser()
  if (user === null) redirect(signIn)

  const status = phoneStatus(await getMyPhone(), new Date())
  const route = gateScreen(status, gate)
  if (!route.render) redirect(route.redirect)

  return (
    <PageShell>
      <PhoneNotice flags={query} status={status} />
      <VerifyPhoneScreen
        status={status}
        texts={await verifyScreenTexts(status, gate.reason)}
        formTexts={await phoneNumberFormTexts()}
        available={await codeAvailability(user.id)}
        hrefs={{
          code: codePath(gate),
          signIn,
          self,
          notNow: gate.reason === null ? null : notNowDestination(gate),
        }}
      />
    </PageShell>
  )
}
