import {
  APPLICATION_FLAG,
  APPLICATION_ID_PATTERN,
  MY_APPLICATION_PATTERN,
  myApplicationPath,
} from '@/lib/applications/paths'
import { LISTING_PATH, petPath } from '@/lib/pets/paths'
import { PET_CODE_PATTERN } from '@/lib/pets/rules'
import { notNowDestination, parseGate, validPath, type Gate } from './gate'

/** Los dos niveles que preguntan al dejarlos (historia #234); la base guarda estas claves. */
export const EXIT_LEVELS = ['phone', 'identity'] as const
export type ExitLevel = (typeof EXIT_LEVELS)[number]

/**
 * Desde dónde llegó la persona a verificarse: publicar, solicitar, por su cuenta (R5) o porque se la
 * pidió quien publicó (historia #257, R8).
 */
export const EXIT_ORIGINS = ['publish', 'apply', 'self', 'asked'] as const
export type ExitOrigin = (typeof EXIT_ORIGINS)[number]

/** Las cinco opciones de cada nivel, en el orden en que se ofrecen; «Otra cosa» siempre última (R6). */
export const EXIT_OPTIONS = {
  phone: ['no_number', 'no_code', 'later', 'groups', 'other'],
  identity: ['no_id_photos', 'later', 'too_much', 'groups', 'other'],
} as const satisfies Record<ExitLevel, readonly string[]>

export type ExitOption<L extends ExitLevel = ExitLevel> = (typeof EXIT_OPTIONS)[L][number]

/** Todas, sin repetir: lo que la base puede guardar en algún nivel. */
export const ALL_EXIT_OPTIONS = [
  'no_number',
  'no_code',
  'no_id_photos',
  'later',
  'too_much',
  'groups',
  'other',
] as const satisfies readonly ExitOption[]

/** Lo que devuelven contestar y seguir sin contestar en la base (R3). */
export const EXIT_OUTCOMES = ['answered', 'skipped', 'already', 'invalid'] as const
export type ExitOutcome = (typeof EXIT_OUTCOMES)[number]

/** El largo del texto de «Otra cosa», contado como `char_length` en la base. */
export const EXIT_TEXT_MAX = 300

/** Desde cuántos caracteres se ve cuánto queda: antes no hace falta mirarlo. */
export const EXIT_COUNTER_FROM = 250

export function isExitOption(level: ExitLevel, option: string): boolean {
  return EXIT_OPTIONS[level].some((value) => value === option)
}

/**
 * De dónde sale la pregunta: la puerta del teléfono, el animal del pedido de identidad y la solicitud
 * desde la que quien publicó la pidió. La solicitud viene sin confirmar: antes de contarla, la acción
 * pregunta si es de quien sale.
 */
export type ExitPlace = { gate: Gate; returnCode: string | null; applicationId: string | null }

/** El animal del pedido de identidad, si vino uno válido (`?animal=`, #63). */
export function returnCodeOf(asked: string | null | undefined): string | null {
  // Stryker disable next-line ConditionalExpression: equivalente — `test` convierte null y undefined en «null» y «undefined», que nunca son un código de diez caracteres
  return asked != null && PET_CODE_PATTERN.test(asked) ? asked : null
}

// La pantalla que postea «Ahora no» viaja con su consulta: de ahí salen la puerta y el animal, así
// la acción no confía en un origen que mande el navegador.
export function exitPlaceOf(from: string | null): ExitPlace {
  const path = validPath(from)
  const query = new URL(`http://sitio${path ?? ''}`).searchParams
  return {
    gate: parseGate({
      para: query.get('para') ?? undefined,
      next: query.get('next') ?? undefined,
      desde: query.get('desde') ?? undefined,
    }),
    returnCode: returnCodeOf(query.get('animal')),
    applicationId: applicationIdOf(query.get(APPLICATION_FLAG)),
  }
}

function applicationIdOf(value: string | null): string | null {
  return APPLICATION_ID_PATTERN.test(String(value)) ? value : null
}

/**
 * La solicitud de la que depende el origen `asked`: la de la marca en la identidad, o la Mi solicitud
 * a la que vuelve la puerta del teléfono pedida para verificar la identidad desde ahí.
 */
export function askedApplicationOf(level: ExitLevel, place: ExitPlace): string | null {
  if (level === 'identity') return place.applicationId
  const { reason, from } = place.gate
  return reason === 'identity' ? (MY_APPLICATION_PATTERN.exec(String(from))?.[1] ?? null) : null
}

/** La solicitud que no se pudo confirmar como de quien sale, fuera: como si no viniera de ninguna. */
export function withoutApplication(level: ExitLevel, place: ExitPlace): ExitPlace {
  return level === 'identity'
    ? { ...place, applicationId: null }
    : { ...place, gate: { ...place.gate, from: null } }
}

// Una ficha de animal: `/animales/<código>`. La identidad pedida desde ahí es para solicitarlo.
function isPetPath(path: string | null): boolean {
  const prefix = `${LISTING_PATH}/`
  return path?.startsWith(prefix) === true && PET_CODE_PATTERN.test(path.slice(prefix.length))
}

export function exitOrigin(level: ExitLevel, place: ExitPlace): ExitOrigin {
  if (askedApplicationOf(level, place) !== null) return 'asked'
  if (level === 'identity') return place.returnCode === null ? 'self' : 'apply'
  const { reason, from } = place.gate
  if (reason === 'publish') return 'publish'
  if (reason === 'apply') return 'apply'
  if (reason === 'identity' && isPetPath(from)) return 'apply'
  return 'self'
}

const PROFILE_PATH = '/mi-perfil'

// A donde llevaba «Ahora no» antes de la pregunta: la puerta del teléfono vuelve a la pantalla
// desde la que se tocó la acción; el pedido de identidad, a la solicitud, al animal o a Mi perfil.
export function exitDestination(level: ExitLevel, place: ExitPlace): string {
  if (level === 'identity') {
    if (place.applicationId !== null) return myApplicationPath(place.applicationId)
    return place.returnCode === null ? PROFILE_PATH : petPath(place.returnCode)
  }
  return place.gate.reason === null ? PROFILE_PATH : notNowDestination(place.gate)
}

/** La marca de la pantalla que muestra la pregunta en lugar del formulario (R4). */
export const EXIT_QUESTION_FLAG = 'pregunta'

// Las pantallas que dibujan la pregunta; la primera es la del nivel.
const SCREENS: Record<ExitLevel, readonly [string, ...string[]]> = {
  phone: ['/verificar-telefono', '/verificar-telefono/codigo'],
  identity: ['/verificar-identidad'],
}

// La misma pantalla, con su consulta y la marca. Si se dejó desde una que no dibuja la pregunta
// (Cancelar la verificación en Mi perfil), la del nivel: ahí se ve, y sin puerta vuelve a Mi perfil.
// Se compara lo que queda después de normalizar: `/.//otro.com` la URL lo resuelve a `//otro.com`.
export function exitQuestionPath(level: ExitLevel, from: string | null): string {
  const screens = SCREENS[level]
  const parsed = new URL(validPath(from) ?? screens[0], 'http://sitio')
  const url = screens.includes(parsed.pathname) ? parsed : new URL(screens[0], 'http://sitio')
  url.searchParams.set(EXIT_QUESTION_FLAG, '1')
  return `${url.pathname}${url.search}`
}

export function isQuestionShown(params: { [EXIT_QUESTION_FLAG]?: string }): boolean {
  return params[EXIT_QUESTION_FLAG] === '1'
}

/**
 * «Ahora no»: el enlace de siempre al destino, o el botón que pregunta qué frena cuando a esa
 * persona todavía no se le preguntó. `from` es la pantalla con su consulta.
 */
export type NotNowTarget = { ask: false; href: string } | { ask: true; from: string }

export function notNowTarget(ask: boolean, place: { from: string; href: string }): NotNowTarget {
  return ask ? { ask: true, from: place.from } : { ask: false, href: place.href }
}
