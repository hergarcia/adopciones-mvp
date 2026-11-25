import type { NextRequest } from 'next/server'
import { linkProblemPath } from '@/lib/auth/link-problem'
import { linkStatus } from '@/lib/auth/link-status'
import { safeDestination } from '@/lib/auth/next-destination'
import { getLoginLink, markLinkConsumed } from '@/lib/supabase/queries/login-links'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { consumeLoginToken, getSessionUser } from '@/lib/supabase/queries/session'
import { track } from '@/lib/analytics/track'
import { redirectTo } from '@/lib/links/redirect-to'

// Vive fuera de `[locale]` a propósito, y por eso el matcher del proxy excluye `auth`: con
// `localePrefix: 'as-needed'`, next-intl reescribiría esto a /es/auth/confirm, que no existe, y
// el enlace del correo daría 404.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const linkId = searchParams.get('link')
  const tokenHash = searchParams.get('token_hash')
  const requested = searchParams.get('next')
  const next = safeDestination(requested)
  const problem = (motivo: string, id: string | null) =>
    redirectTo(linkProblemPath(motivo, id, requested))

  if (!linkId || !tokenHash) return problem('unknown', null)

  const stored = await getLoginLink(linkId)
  const status = linkStatus(stored, new Date())
  // Sin fila no se puede reenviar nada: pasar el id ofrecería una acción que falla siempre.
  if (stored === null) return problem(status, null)
  if (status !== 'usable') return problem(status, linkId)

  const current = await getSessionUser()

  if (current !== null) {
    // Quien ya está adentro con otra dirección no cambia de cuenta en silencio, y su enlace **no**
    // se consume: su dueña no tiene por qué perder uno que nunca usó (FR-007c).
    if (current.email !== stored.email) {
      return redirectTo(
        `/entrar/enlace?motivo=otra-cuenta&correo=${encodeURIComponent(current.email)}`,
      )
    }
    return redirectTo(next)
  }

  // Una cuenta borrada deja su enlace sin dueño: el servicio ya no conoce la dirección, así que
  // esto falla y no recrea nada (FR-007b).
  const consumed = await consumeLoginToken(tokenHash)
  if (!consumed.ok) return problem('unknown', linkId)

  await markLinkConsumed(stored.id, new Date())

  // La cuenta es nueva si este es su primer ingreso, no si le falta el perfil: quien lo dejó a
  // medias y vuelve otro día ya la empezó, y contarlo de nuevo inflaría el embudo para siempre.
  await track(stored.firstSignIn ? 'account_creation_started' : 'signed_in_with_link')

  const profile = await getMyProfile()

  const destination = profile === null ? completeProfileUrl(next) : next
  return redirectTo(destination)
}

function completeProfileUrl(next: string): string {
  return `/completar-perfil?next=${encodeURIComponent(next)}`
}
