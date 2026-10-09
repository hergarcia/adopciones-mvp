import { whatsappUrl } from '@/lib/applications/whatsapp'

/** La ruta propia del WhatsApp de soporte: mide desde qué pantalla se tocó y redirige (research R11). */
export const SUPPORT_WHATSAPP_PATH = '/api/soporte/whatsapp'

/** A dónde enlaza el sitio para el WhatsApp de soporte; sin número, a ningún lado (FR-031). */
export function supportWhatsAppHref(number: string | null): string | null {
  return number === null ? null : SUPPORT_WHATSAPP_PATH
}

// Solo el saludo, que nombra al sitio: ni la persona ni la pantalla viajan a WhatsApp (FR-053).
export function supportWhatsAppUrl(number: string | null, greeting: string): string | null {
  return number === null ? null : whatsappUrl(number, greeting)
}
