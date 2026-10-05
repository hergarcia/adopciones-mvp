import { isLinkPreview } from '@/lib/analytics/link-preview'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { track } from '@/lib/analytics/track'
import { renewalResultPath } from '@/lib/pets/paths'
import type { RenewalAsked } from '@/lib/pets/renewal-result'
import { hashRenewalToken, isRenewalToken } from '@/lib/pets/renewal-token'
import { renewByLink } from '@/lib/supabase/queries/pet-renewal'

type Context = { params: Promise<{ token: string }> }

async function renew(token: string): Promise<RenewalAsked> {
  try {
    const outcome = await renewByLink(hashRenewalToken(token))
    if (outcome === 'renewed') await track('pet_renewed', { via: 'email' })
    if (outcome === 'republished') await track('pet_republished', { from: 'expired', via: 'email' })
    return outcome
  } catch {
    return 'error'
  }
}

// «Sigue disponible» del correo (research R5): un toque renueva sin ingresar y redirige a una
// pantalla que solo lee, así recargarla no vuelve a renovar. Quien arma una vista previa (el correo
// reenviado por WhatsApp) no renueva nada. Lo que no tiene forma de token no va a la base.
export async function GET(request: Request, { params }: Context) {
  await redirectIfSuspended()
  const { token } = await params
  const asked: RenewalAsked = !isRenewalToken(token)
    ? 'invalid'
    : isLinkPreview(request.headers.get('user-agent'))
      ? 'preview'
      : await renew(token)
  return Response.redirect(new URL(renewalResultPath(token, asked), request.url), 303)
}

// Algunos lectores de correo prueban los enlaces con HEAD antes de mostrarlos: eso no es un toque.
export function HEAD() {
  return new Response(null, { status: 204 })
}
