import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CodeEntryScreen } from '@/components/verification/code-entry-screen'
import { signInWithNext } from '@/lib/auth/next-destination'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { verificationExitDue } from '@/lib/supabase/queries/verification-exits'
import { EXIT_QUESTION_FLAG, exitDestination, notNowTarget } from '@/lib/verification/exit-question'
import {
  codePath,
  codeScreen,
  isClaiming,
  numberInUsePath,
  parseGate,
  verifyPath,
  withheldPath,
} from '@/lib/verification/gate'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import { hasPending, phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { gateTexts, phoneCodeFormTexts } from '@/app/[locale]/_components/verification-texts'
import { codeAvailability } from '@/app/[locale]/(app)/_components/code-availability'
import { exitQuestionIfShown } from '@/app/[locale]/(app)/_components/exit-question-screen'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    para?: string
    next?: string
    desde?: string
    quedarme?: string
    [EXIT_QUESTION_FLAG]?: string
  }>
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
  const claiming = isClaiming(query)
  const self = codePath(gate, { claiming })
  const signIn = signInWithNext(self)

  await requireProfile(self)
  const user = await getSessionUser()
  if (user === null) redirect(signIn)

  const [row, available] = await Promise.all([getMyPhone(), codeAvailability(user.id)])
  const status = phoneStatus(row, new Date())
  const route = codeScreen(status, gate)
  if (!route.render) redirect(route.redirect)
  // `codeScreen` ya lo decidió; esto solo le dice al compilador que hay un número a medias.
  if (!hasPending(status)) redirect(verifyPath(gate))

  const destination = exitDestination('phone', { gate, returnCode: null })
  const question = await exitQuestionIfShown('phone', query, destination)
  if (question !== null) return question

  // Quedarse con un número de otra cuenta es recuperarlo (#25): su «Ahora no» no pregunta (FR-004).
  const mayAsk = gate.reason !== null && !claiming
  const [t, screen, s, reason, formTexts, askOnLeave] = await Promise.all([
    getTranslations('verification.code'),
    getTranslations('verification.screen'),
    getTranslations('verification.status'),
    gateTexts(gate.reason),
    phoneCodeFormTexts(),
    mayAsk ? verificationExitDue('phone') : false,
  ])

  return (
    <PageShell>
      <CodeEntryScreen
        number={formatPhoneNumber(status.number)}
        texts={{
          title: t('title'),
          sentTo: String(t.raw('sent_to')),
          correct: s('correct'),
          notNow: screen('not_now'),
          reason: reason?.reason ?? null,
        }}
        formTexts={formTexts}
        gate={query}
        available={available}
        hrefs={{
          verify: verifyPath(gate),
          inUse: numberInUsePath(gate, claiming),
          withheld: withheldPath(gate),
          signIn,
          notNow:
            gate.reason === null
              ? null
              : notNowTarget(askOnLeave, { from: self, href: destination }),
        }}
      />
    </PageShell>
  )
}
