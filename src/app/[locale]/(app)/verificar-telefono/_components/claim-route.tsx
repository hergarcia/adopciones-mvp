import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ClaimNeedsNewCode } from '@/components/verification/claim-needs-new-code'
import { ClaimNewCodeRequest } from '@/components/verification/claim-new-code-request'
import { LinkButton } from '@/components/ui/link-button'
import { requireProfile } from '@/lib/auth/require-profile'
import { getMyClaim } from '@/lib/supabase/queries/phone-claims'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { claimDeadline, type ClaimDeadline } from '@/lib/verification/claim-deadline'
import { claimScreen, type Claim } from '@/lib/verification/claim-outcome'
import { codePath, parseGate, verifyPath, type Gate } from '@/lib/verification/gate'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import { phoneStatus, type PhoneRow } from '@/lib/verification/phone-status'
import type { RetryDisplay } from '@/lib/verification/retry-at'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'
import {
  claimNewCodeRequestTexts,
  needsNewCodeTexts,
} from '@/app/[locale]/_components/verification-texts'
import { codeAvailability } from '@/app/[locale]/(app)/_components/code-availability'

export type ClaimRouteQuery = {
  para?: string
  next?: string
  desde?: string
  guardado?: string
  error?: string
}

type Loaded = {
  gate: Gate
  /** «Entrar» de vuelta a esta misma pantalla, con la puerta adentro (FR-009c). */
  signIn: string
  row: PhoneRow | null
  available: RetryDisplay
}

export type ClaimRoute =
  | (Loaded & {
      kind: 'show'
      claim: Claim
      /** El número de la prueba en formato de pantalla. */
      number: string
      deadline: ClaimDeadline
      continueTo: string | null
    })
  | (Loaded & { kind: 'needs_new_code' })

// Lo que comparten «Ese número está en otra cuenta» y la confirmación al cargarse: la sesión, el
// perfil, el teléfono, la prueba y la decisión de `claimScreen`. Sin prueba y con un teléfono
// verificado, a «Mi perfil» sin marca (FR-009d).
export async function loadClaimRoute(
  query: ClaimRouteQuery,
  pathOf: (gate: Gate) => string,
): Promise<ClaimRoute> {
  const gate = parseGate(query)
  const self = pathOf(gate)
  const signIn = `/entrar?next=${encodeURIComponent(self)}`

  await requireProfile(self)
  const user = await getSessionUser()
  if (user === null) redirect(signIn)

  const [row, claim, available] = await Promise.all([
    getMyPhone(),
    getMyClaim(),
    codeAvailability(user.id),
  ])
  const now = new Date()
  const screen = claimScreen({ claim, status: phoneStatus(row, now), gate })
  if (screen.kind === 'redirect') redirect(screen.to)

  const loaded = { gate, signIn, row, available }
  if (screen.kind === 'needs_new_code') return { ...loaded, kind: 'needs_new_code' }

  return {
    ...loaded,
    kind: 'show',
    claim: screen.claim,
    number: formatPhoneNumber(screen.claim.number),
    deadline: claimDeadline(screen.claim.validUntil, now, {
      timeZone: URUGUAY_TIME_ZONE,
      locale: await getLocale(),
    }),
    continueTo: screen.continueTo,
  }
}

// La prueba se venció con la pantalla abierta, o una acción se enteró de que ya no vale: el pedido
// de un código nuevo al número que la persona tiene a la vista (FR-008).
export async function ExpiredClaimView({
  route,
}: {
  route: Extract<ClaimRoute, { kind: 'show' }>
}) {
  const [texts, requestTexts] = await Promise.all([
    needsNewCodeTexts(true),
    claimNewCodeRequestTexts(),
  ])
  return (
    <ClaimNeedsNewCode texts={texts} number={route.number}>
      <ClaimNewCodeRequest
        number={route.number}
        texts={requestTexts}
        available={route.available}
        codeHref={codePath(route.gate)}
        signInHref={route.signIn}
      />
    </ClaimNeedsNewCode>
  )
}

// Cargada sin prueba y sin teléfono verificado: el producto ya no conserva el número, así que se
// escribe de nuevo en «Verificar teléfono» (FR-013e).
export async function NeedsNewCodeScreen({ gate }: { gate: Gate }) {
  const [texts, t] = await Promise.all([
    needsNewCodeTexts(false),
    getTranslations('verification.claim'),
  ])
  return (
    <ClaimNeedsNewCode texts={texts}>
      <LinkButton href={verifyPath(gate)} variant="tirita" size="lg">
        {t('new_code_verify')}
      </LinkButton>
    </ClaimNeedsNewCode>
  )
}
