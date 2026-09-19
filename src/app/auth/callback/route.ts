import { NextResponse, type NextRequest } from 'next/server'
import { track } from '@/lib/analytics/track'
import { isVerifiedByGoogle } from '@/lib/auth/google'
import { safeDestination } from '@/lib/auth/next-destination'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import {
  endSession,
  exchangeOAuthCode,
  getProviderIdentities,
  getSessionUser,
} from '@/lib/supabase/queries/session'

// Fuera de `[locale]`, igual que /auth/confirm y por el mismo motivo: el matcher del proxy excluye
// `auth` para que next-intl no reescriba esto a /es/auth/callback.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = safeDestination(request.nextUrl.searchParams.get('next'))

  // Cancelar en Google vuelve sin código: no se hizo nada y se puede intentar por correo (FR-010).
  if (!code) return back(request, 'google-cancelado')

  const exchanged = await exchangeOAuthCode(code)
  if (!exchanged.ok) return back(request, 'google-cancelado')

  const user = await getSessionUser()
  if (user === null) return back(request, 'google-cancelado')

  // No alcanza con que el correo de la persona esté confirmado: eso pudo haberlo puesto nuestro
  // propio enlace. Lo que se comprueba es que Google confirme esa dirección (FR-009a).
  if (!isVerifiedByGoogle(await getProviderIdentities(user.id))) {
    await endSession()
    return back(request, 'google-sin-verificar')
  }

  const profile = await getMyProfile()
  await track(profile === null ? 'account_creation_started' : 'signed_in_with_google')

  const destination = profile === null ? `/completar-perfil?next=${encodeURIComponent(next)}` : next
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin))
}

function back(request: NextRequest, motivo: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/entrar'
  url.search = `?motivo=${motivo}`
  return NextResponse.redirect(url)
}
