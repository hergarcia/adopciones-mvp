import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { IdentityRequestForm } from '@/components/verification/identity-request-form'
import { IdentityStatusView } from '@/components/verification/identity-status-view'
import { VerifyHeading } from '@/components/verification/verify-heading'
import { track } from '@/lib/analytics/track'
import { trackQuestionAction } from '@/lib/analytics/track-question-action'
import { APPLICATION_FLAG, RETURN_FLAG } from '@/lib/applications/paths'
import { signInWithNext } from '@/lib/auth/next-destination'
import { requireProfile } from '@/lib/auth/require-profile'
import { SUPPORT_EMAIL } from '@/lib/config'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { verificationExitDue } from '@/lib/supabase/queries/verification-exits'
import { listMyVouches } from '@/lib/supabase/queries/vouches'
import { EXIT_QUESTION_FLAG, notNowTarget, returnCodeOf } from '@/lib/verification/exit-question'
import { NO_GATE, gateCheck, verifyPath } from '@/lib/verification/gate'
import { canRequest } from '@/lib/verification/identity-status'
import { myVerification, verificationLevel } from '@/lib/verification/level'
import { countingReceived } from '@/lib/vouches/my-vouches'
import { MyBadge } from '@/app/[locale]/_components/my-badge'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { identityStatusTexts } from '@/app/[locale]/_components/identity-status-texts'
import { IDENTITY_PATH, identityRequestFormTexts } from '@/app/[locale]/_components/identity-texts'
import { exitQuestionIfShown } from '@/app/[locale]/(app)/_components/exit-question-screen'
import {
  askedApplication,
  flaggedApplication,
  identityRoutes,
} from '@/app/[locale]/(app)/_components/identity-routes'
import {
  IdentityNotice,
  NOT_WITHDRAWN_FLAG,
  WITHDRAWN_FLAG,
} from '@/app/[locale]/(app)/_components/identity-notice'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    pedir?: string
    guardado?: string
    error?: string
    [RETURN_FLAG]?: string
    [APPLICATION_FLAG]?: string
    [EXIT_QUESTION_FLAG]?: string
  }>
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
  const askedId = flaggedApplication(query[APPLICATION_FLAG])

  // Antes de la puerta de ingreso: el toque desde una página de preguntas cuenta sin sesión. La
  // solicitud se confirma recién con la sesión; la vuelta del ingreso la conserva tal cual vino.
  await trackQuestionAction(IDENTITY_PATH)
  const asked = identityRoutes(askedId, askedId === null ? returnCodeOf(query[RETURN_FLAG]) : null)
  await requireProfile(query.pedir === '1' ? asked.newPath : IDENTITY_PATH)

  const [askedFor, phoneRow, record] = await Promise.all([
    askedApplication(askedId),
    getMyPhone(),
    getMyIdentity(),
  ])
  const applicationId = askedFor?.id ?? null
  const returnCode = applicationId === null ? returnCodeOf(query[RETURN_FLAG]) : null
  const { newPath, leavePath, sentPath } = identityRoutes(applicationId, returnCode)
  if (record === null) redirect(signInWithNext(IDENTITY_PATH))

  const { phone, identity: status } = myVerification(
    { phone: phoneRow, identity: record },
    new Date(),
  )

  // Con algo que mostrar, el estado, también sin teléfono (Edge Cases). Un rechazo o un vencimiento
  // pasan a la vista de pedir solo con «Intentar de nuevo».
  if (status.kind !== 'none' && !(query.pedir === '1' && canRequest(status))) {
    // Con el tope el formulario no se llega a ver: abrir la pantalla es el intento (FR-035). Es el
    // único lugar que lo marca; el envío bloqueado refresca y cae acá.
    if (status.kind === 'capped') await track('identity_cap_reached', { origin: ORIGIN })
    // El nivel 3 sale de los avales, que se leen solo con la identidad aprobada (FR-023).
    const user = status.kind === 'approved' ? await getSessionUser() : null
    const vouches = user === null ? [] : await listMyVouches(user.id)
    const level = verificationLevel(phone, status, countingReceived(vouches))
    return (
      <PageShell width="wide">
        <IdentityNotice flags={query} />
        <IdentityStatusView
          kind={status.kind}
          texts={await identityStatusTexts(status, level, verifyPath(NO_GATE))}
          badge={<MyBadge level={level} size="lg" from={IDENTITY_PATH} />}
          supportEmail={SUPPORT_EMAIL}
          hrefs={{
            back: PROFILE_PATH,
            withdrawn: `${IDENTITY_PATH}?guardado=${WITHDRAWN_FLAG}`,
            notWithdrawn: `${IDENTITY_PATH}?error=${NOT_WITHDRAWN_FLAG}`,
          }}
        />
      </PageShell>
    )
  }

  // Pedir exige nivel 1 (FR-002): la puerta de la historia #10, que al verificar vuelve acá. Quien
  // acaba de retirar sin nivel 1 va a «Mi perfil», que muestra la confirmación; la puerta la perdería.
  const gate = gateCheck(phone, { path: newPath, reason: 'identity', from: leavePath })
  if (!gate.pass) {
    redirect(
      query.guardado === WITHDRAWN_FLAG
        ? `${PROFILE_PATH}?guardado=${WITHDRAWN_FLAG}`
        : gate.gatePath,
    )
  }

  const question = await exitQuestionIfShown('identity', query, leavePath)
  if (question !== null) return question

  await track('identity_request_started', { origin: ORIGIN })
  const [t, askOnLeave] = await Promise.all([
    getTranslations('identity.request'),
    verificationExitDue('identity'),
  ])

  return (
    // Ancho completo: de 768 a 1024 las dos fotos van lado a lado a lo ancho de la hoja. El texto
    // sigue en la medida de lectura, que la pone cada bloque.
    <PageShell width="full">
      <IdentityNotice flags={query} />
      <IdentityRequestForm
        header={
          <VerifyHeading
            texts={{
              title: t('title'),
              lead:
                askedFor === null
                  ? t('lead')
                  : `${t('asked_by', {
                      publisher: askedFor.publisher ?? t('publisher_fallback'),
                      pet: askedFor.pet,
                    })} ${t('lead')}`,
            }}
          />
        }
        texts={await identityRequestFormTexts()}
        origin={ORIGIN}
        returnCode={returnCode}
        notNow={notNowTarget(askOnLeave, { from: newPath, href: leavePath })}
        hrefs={{
          phoneGate: verifyPath({ reason: 'identity', next: newPath, from: leavePath }),
          signIn: signInWithNext(newPath),
          ...(sentPath === undefined ? {} : { sent: sentPath }),
        }}
      />
    </PageShell>
  )
}
