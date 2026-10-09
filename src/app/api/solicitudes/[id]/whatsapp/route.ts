import { getTranslations } from 'next-intl/server'
import { whatsappTappedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import { myApplicationPath, publisherApplicationPath } from '@/lib/applications/paths'
import { whatsappMessage, whatsappUrl } from '@/lib/applications/whatsapp'
import { signInWithNext } from '@/lib/auth/next-destination'
import { APP_NAME } from '@/lib/config'
import { routing } from '@/lib/i18n/routing'
import {
  getApplicationContact,
  getPublisherApplication,
} from '@/lib/supabase/queries/application-responses'
import { getSessionUser } from '@/lib/supabase/queries/session'

function seeOther(location: string, request: Request) {
  return Response.redirect(new URL(location, request.url), 303)
}

// «Abrir WhatsApp» (research R9): con la sesión, vuelve a preguntar si el contacto se puede ver —la
// misma regla que la pantalla—, registra de qué punta se tocó y lleva a `wa.me` con el mensaje ya
// escrito. Si ya no se puede (se dejó sin efecto, se perdió el número), vuelve a la solicitud del
// lado de quien mira, que dice cómo está. Sin sesión, a ingresar con la vuelta acá.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const self = new URL(request.url).pathname
  if ((await getSessionUser()) === null) return seeOther(signInWithNext(self), request)

  const contact = await getApplicationContact(id).catch(() => null)
  if (contact === null || contact.phone === null) {
    const mine = await getPublisherApplication(id).catch(() => null)
    return seeOther(mine === null ? myApplicationPath(id) : publisherApplicationPath(id), request)
  }

  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: 'applications.whatsapp',
  })
  const text = whatsappMessage(
    {
      side: contact.side,
      petName: contact.petName,
      senderName: contact.viewerName,
      appName: APP_NAME,
    },
    (side, values) => t(side, values),
  )
  await trackAll([whatsappTappedEvent(contact.side)])
  return Response.redirect(whatsappUrl(contact.phone, text), 303)
}
