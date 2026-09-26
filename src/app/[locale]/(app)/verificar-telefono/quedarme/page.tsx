import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ClaimConfirmForm } from '@/components/verification/claim-confirm-form'
import { ClaimDeadline } from '@/components/verification/claim-deadline'
import { ClaimNumberScreen } from '@/components/verification/claim-number-screen'
import { claimPath, inUsePath } from '@/lib/verification/gate'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import {
  ClaimRouteShell,
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
  const t = await getTranslations('metadata.phone_claim')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function ClaimNumberPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const query = await searchParams
  const route = await loadClaimRoute(query, claimPath)
  if (route.kind === 'needs_new_code') {
    return (
      <ClaimRouteShell gate={route.gate}>
        <NeedsNewCodeScreen gate={route.gate} />
      </ClaimRouteShell>
    )
  }

  const t = await getTranslations('verification.claim')
  const previous = route.row?.verifiedNumber ?? null

  return (
    <ClaimRouteShell gate={route.gate}>
      <ClaimDeadline msLeft={route.deadline.msLeft} expired={<ExpiredClaimView route={route} />}>
        <ClaimNumberScreen
          texts={{
            title: t('confirm_title', { number: route.number }),
            loses: t('confirm_loses'),
            notified: t('confirm_notified'),
            wayBack: t('confirm_way_back'),
            previous:
              previous === null
                ? null
                : t('confirm_previous', { number: formatPhoneNumber(previous) }),
            deadline: t('deadline', { time: route.deadline.label }),
            back: t('back'),
          }}
          backHref={inUsePath(route.gate)}
        >
          <ClaimConfirmForm
            number={route.number}
            texts={{
              confirm: t('confirm'),
              checkFailed: t('errors.check_failed'),
              unknown: t('errors.unknown'),
            }}
            gate={{ para: query.para, next: query.next, desde: query.desde }}
            signInHref={route.signIn}
          />
        </ClaimNumberScreen>
      </ClaimDeadline>
    </ClaimRouteShell>
  )
}
