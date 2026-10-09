import { routing } from '@/lib/i18n/routing'
import type { FeedbackScreen } from './types'

/** Opinar, en todas las pantallas arriba y en el pie. */
export const FEEDBACK_PATH = '/opinar'

export type FeedbackPlace = { screen: FeedbackScreen; subject: string | null }

// Lo que cabe en `feedback.subject`: un código de animal o el id público de un perfil.
const SUBJECT = /^[\w-]{1,64}$/u

// Por el primer segmento. Solo la ficha y el perfil público guardan qué mostraban; de una pantalla
// privada, solo su nombre, porque qué solicitud o qué animal propio mostraba diría quién mandó la
// opinión (spec §Edge Cases, research R9).
const PRIVATE: ReadonlyMap<string, FeedbackScreen> = new Map([
  ['mis-animales', 'my_pets'],
  ['mis-solicitudes', 'my_applications'],
  ['solicitudes', 'publisher_applications'],
  ['mi-perfil', 'my_profile'],
  ['verificar-identidad', 'verification'],
  ['verificar-telefono', 'verification'],
  ['revision', 'review'],
  ['entrar', 'sign_in'],
  ['completar-perfil', 'sign_in'],
  ['cuenta-suspendida', 'suspended'],
])

function withSubject(screen: 'pet' | 'profile', subject: string | undefined): FeedbackPlace {
  return { screen, subject: subject !== undefined && SUBJECT.test(subject) ? subject : null }
}

/** La pantalla desde la que se mandó una opinión, por su ruta; `other` si no es ninguna conocida. */
export function feedbackScreen(pathname: string): FeedbackPlace {
  const segments = pathname
    .replace(/[?#].*/su, '')
    .split('/')
    .filter((part) => part !== '')
  const locales: readonly string[] = routing.locales
  const [first, second, third] = segments.slice(locales.includes(segments[0]) ? 1 : 0)

  if (first === undefined) return { screen: 'home', subject: null }
  if (first === 'animales') {
    if (second === undefined) return { screen: 'listing', subject: null }
    if (third === undefined) return withSubject('pet', second)
  }
  if (first === 'perfil' && third === undefined) return withSubject('profile', second)
  if (first === 'niveles' && second === undefined) return { screen: 'levels', subject: null }
  if (first === 'mis-solicitudes' && second !== undefined)
    return { screen: 'my_application', subject: null }
  return { screen: PRIVATE.get(first) ?? 'other', subject: null }
}

/**
 * La ruta desde la que se llegó a Opinar, leída del `Referer`: solo si es de este mismo sitio y no
 * es Opinar. El layout no sabe en qué pantalla está y el enlace sale igual en todas (research R10).
 */
export function feedbackOrigin(referer: string | null, host: string | null): string | null {
  if (referer === null || host === null) return null
  const url = URL.parse(referer)
  if (url?.host !== host) return null
  return url.pathname === FEEDBACK_PATH ? null : url.pathname
}
