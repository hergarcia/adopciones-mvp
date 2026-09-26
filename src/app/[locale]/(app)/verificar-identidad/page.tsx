import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { IdentityRequestForm } from '@/components/verification/identity-request-form'
import { IdentityStatusView } from '@/components/verification/identity-status-view'
import { VerifyHeading } from '@/components/verification/verify-heading'
import { track } from '@/lib/analytics/track'
import { requireProfile } from '@/lib/auth/require-profile'
import { SUPPORT_EMAIL } from '@/lib/config'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { NO_GATE, gateCheck, verifyPath } from '@/lib/verification/gate'
import { canRequest, identityStatus } from '@/lib/verification/identity-status'
import { isLevelOne, phoneStatus } from '@/lib/verification/phone-status'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { identityStatusTexts } from '@/app/[locale]/_components/identity-status-texts'
import {
  IDENTITY_NEW_PATH,
  IDENTITY_PATH,
  identityRequestFormTexts,
} from '@/app/[locale]/_components/identity-texts'
import { IdentityNotice } from './_components/identity-notice'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ pedir?: string; guardado?: string }>
}

const PROFILE_PATH = '/mi-perfil'
const ORIGIN = 'profile'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.identity')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function VerifyIdentityPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const query = await searchParams

  await requireProfile(query.pedir === '1' ? IDENTITY_NEW_PATH : IDENTITY_PATH)
  const [phoneRow, record] = await Promise.all([getMyPhone(), getMyIdentity()])
  if (record === null) redirect(`/entrar?next=${encodeURIComponent(IDENTITY_PATH)}`)

  const now = new Date()
  const phone = phoneStatus(phoneRow, now)
  const status = identityStatus(record, now)

  // Con algo que mostrar, el estado, también sin teléfono (Edge Cases). Un rechazo o un vencimiento
  // pasan a la vista de pedir solo con «Intentar de nuevo».
  if (status.kind !== 'none' && !(query.pedir === '1' && canRequest(status))) {
    if (status.kind === 'capped') await track('identity_cap_reached', { origin: ORIGIN })
    return (
      <PageShell>
        <IdentityStatusView
          kind={status.kind}
          texts={await identityStatusTexts(status, isLevelOne(phone), verifyPath(NO_GATE))}
          supportEmail={SUPPORT_EMAIL}
          hrefs={{ back: PROFILE_PATH, withdrawn: `${IDENTITY_PATH}?guardado=retirado` }}
        />
      </PageShell>
    )
  }

  // Pedir exige nivel 1 (FR-002): la puerta de la historia #10, que al verificar vuelve acá.
  const gate = gateCheck(phone, { path: IDENTITY_NEW_PATH, reason: 'identity', from: PROFILE_PATH })
  if (!gate.pass) redirect(gate.gatePath)

  await track('identity_request_started', { origin: ORIGIN })
  const t = await getTranslations('identity.request')

  return (
    // Ancho completo: las dos fotos van lado a lado desde 768. El texto sigue en la medida de
    // lectura, que la pone cada bloque.
    <PageShell width="full">
      <IdentityNotice flag={query.guardado} />
      <div className="max-w-[var(--measure)]">
        <VerifyHeading texts={{ title: t('title'), lead: t('lead') }} />
      </div>
      <IdentityRequestForm
        texts={await identityRequestFormTexts()}
        origin={ORIGIN}
        hrefs={{
          notNow: PROFILE_PATH,
          phoneGate: verifyPath({
            reason: 'identity',
            next: IDENTITY_NEW_PATH,
            from: PROFILE_PATH,
          }),
          signIn: `/entrar?next=${encodeURIComponent(IDENTITY_PATH)}`,
        }}
      />
    </PageShell>
  )
}
