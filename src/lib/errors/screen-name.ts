import { isSupportedLocale } from '@/lib/i18n/routing'

// Una pantalla por cada `page.tsx` de `src/app/[locale]`; `*` es un segmento cualquiera (el código de
// una ficha, el id de una persona). Las fijas van antes que la variable de su mismo nivel. Los nombres
// son claves en inglés que viajan como etiqueta del aviso: no los lee nadie del sitio, así que no son
// textos de la interfaz (docs/06).
const SCREENS = {
  '/': 'home',
  '/animales': 'listing',
  '/animales/*': 'pet_sheet',
  '/niveles': 'levels',
  '/nosotros': 'about',
  '/perfil/*': 'public_profile',
  '/preguntas': 'questions',
  '/preguntas/*': 'question',
  '/sigue-disponible/*/listo': 'still_available',
  '/opinar': 'feedback',
  '/cuenta-suspendida': 'suspended_account',
  '/completar-perfil': 'complete_profile',
  '/cuenta-borrada': 'account_deleted',
  '/entrar': 'sign_in',
  '/entrar/enlace': 'sign_in_link',
  '/entrar/revisa-tu-correo': 'check_email',
  '/administrar': 'admin',
  '/administrar/personas/*': 'admin_person',
  '/mi-perfil': 'profile',
  '/mi-perfil/editar': 'edit_profile',
  '/mis-animales': 'my_pets',
  '/mis-animales/publicar': 'publish_pet',
  '/mis-animales/*': 'my_pet',
  '/mis-animales/*/editar': 'edit_pet',
  '/mis-animales/*/adoptado': 'pet_adopted',
  '/mis-avales': 'my_vouches',
  '/mis-bloqueos': 'my_blocks',
  '/mis-solicitudes': 'my_applications',
  '/mis-solicitudes/*': 'my_application',
  '/revision': 'review',
  '/revision/encuestas': 'review_surveys',
  '/revision/opiniones': 'review_feedback',
  '/revision/publicaciones': 'review_pets',
  '/revision/reportes': 'review_reports',
  '/revision/suspendidas': 'review_suspended',
  '/revision/*': 'review_request',
  '/solicitar/*': 'apply',
  '/solicitar/*/enviada': 'application_sent',
  '/solicitudes': 'inbox',
  '/solicitudes/*': 'inbox_application',
  '/solicitudes/animal/*': 'inbox_pet',
  '/verificar-identidad': 'identity_request',
  '/verificar-telefono': 'phone_verification',
  '/verificar-telefono/codigo': 'phone_code',
  '/verificar-telefono/en-otra-cuenta': 'phone_in_other_account',
  '/verificar-telefono/no-se-puede-usar': 'phone_unusable',
  '/verificar-telefono/quedarme': 'phone_keep',
  '/muestra': 'samples',
  // Las rutas que llaman las tareas: una falla ahí no pasó en ninguna pantalla.
  '/api/cron/*': 'no_screen',
} as const

export type ScreenName = (typeof SCREENS)[keyof typeof SCREENS] | 'other_screen'

const PATTERNS = Object.entries(SCREENS).map(
  ([pattern, screen]) => [pattern.split('/').filter((part) => part !== ''), screen] as const,
)

// Lo que la forma del archivo (`/app/[locale]/(public)/animales/[code]/page`, la de onRequestError)
// tiene y la dirección real no: la carpeta `app`, el segmento del idioma, los grupos y el archivo.
function segmentsOf(path: string): string[] {
  const segments = path
    .split('/')
    .filter((part) => part !== '' && part !== '[locale]' && !/^\(.*\)$/u.test(part))
  if (segments[0] === 'app') segments.shift()
  if (isSupportedLocale(segments[0])) segments.shift()
  if (segments.at(-1) === 'page' || segments.at(-1) === 'route') segments.pop()
  return segments
}

/**
 * La pantalla de una ruta, en la forma de su archivo o como dirección real, con o sin el idioma.
 * Nunca un segmento de la ruta: `other_screen` si no es ninguna conocida.
 */
export function screenName(path: string): ScreenName {
  const segments = segmentsOf(path)
  const found = PATTERNS.find(
    ([pattern]) =>
      pattern.length === segments.length &&
      pattern.every((part, index) => part === '*' || part === segments[index]),
  )
  return found?.[1] ?? 'other_screen'
}
