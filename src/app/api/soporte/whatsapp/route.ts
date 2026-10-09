import { getTranslations } from 'next-intl/server'
import { supportWhatsAppOpenedEvent } from '@/lib/analytics/survey-events'
import { trackAll } from '@/lib/analytics/track'
import { APP_NAME, SUPPORT_WHATSAPP } from '@/lib/config'
import { feedbackOrigin, feedbackPlace } from '@/lib/feedback/screens'
import { routing } from '@/lib/i18n/routing'
import { supportWhatsAppUrl } from '@/lib/support/whatsapp'

// El WhatsApp de soporte (research R11): el pie es servidor y no sabe en qué pantalla está; el
// `Referer` sí. Se mide desde cuál se tocó —solo su nombre, nunca qué mostraba— y se lleva a `wa.me`
// con el saludo. Sin número no existe.
export async function GET(request: Request) {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'support' })
  const url = supportWhatsAppUrl(SUPPORT_WHATSAPP, t('greeting', { app: APP_NAME }))
  if (url === null) return new Response(null, { status: 404 })

  const { screen } = feedbackPlace(
    feedbackOrigin(request.headers.get('referer'), request.headers.get('host')),
  )
  await trackAll([supportWhatsAppOpenedEvent(screen)])
  return Response.redirect(url, 303)
}
