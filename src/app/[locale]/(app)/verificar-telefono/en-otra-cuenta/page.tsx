import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ClaimChoice } from '@/components/verification/claim-choice'
import { ClaimDeadline } from '@/components/verification/claim-deadline'
import { NumberInUseWays } from '@/components/verification/number-in-use-ways'
import { inUsePath, verifyPath } from '@/lib/verification/gate'
import { phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { PhoneNotice } from '@/app/[locale]/(app)/_components/phone-notice'
import {
  ExpiredClaimView,
  NeedsNewCodeScreen,
  loadClaimRoute,
  type ClaimRouteQuery,
} from '@/app/[locale]/(app)/verificar-telefono/_components/claim-route'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<ClaimRouteQuery>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.phone_in_use')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function PhoneInUsePage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const query = await searchParams
  const route = await loadClaimRoute(query, inUsePath)
  if (route.kind === 'needs_new_code') {
    return (
      <PageShell>
        <NeedsNewCodeScreen gate={route.gate} />
      </PageShell>
    )
  }

  const t = await getTranslations('verification.claim')
  const gate = { para: query.para, next: query.next, desde: query.desde }

  return (
    <PageShell>
      <PhoneNotice flags={query} status={phoneStatus(route.row, new Date())} />
      <ClaimDeadline msLeft={route.deadline.msLeft} expired={<ExpiredClaimView route={route} />}>
        <NumberInUseWays
          texts={{
            title: t('in_use_title'),
            lead: t('in_use_lead', { number: route.number }),
            verifyOther: t('verify_other'),
            continue: t('continue'),
          }}
          verifyHref={verifyPath(route.gate)}
          continueTo={route.continueTo}
          signInOther={null}
          claimChoice={
            <ClaimChoice
              texts={{
                choose: t('choose'),
                deadline: t('deadline', { time: route.deadline.label }),
                unknown: t('errors.unknown'),
              }}
              gate={gate}
              signInHref={route.signIn}
            />
          }
        />
      </ClaimDeadline>
    </PageShell>
  )
}
