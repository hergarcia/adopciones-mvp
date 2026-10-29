import type { ApplyStoppedEvent } from './application-events'
import type { ApplyStop, TrackedEvent } from './events'

// «Quiero adoptar» se cuenta una vez por toque y cada freno una vez por toque y por motivo (#240,
// docs/03 §7). La marca nace en el botón de la ficha y viaja por las vueltas que siguen al toque
// —entrar con la cuenta, verificar el teléfono— diciendo lo que ya se contó. Sin la marca, la
// pantalla no viene de un toque: recargar, el correo de la identidad aprobada o el envío del
// cuestionario no cuentan nada.
export const TAP_FLAG = 'toque'

/** Lo que ya se contó del toque: el «Quiero adoptar» y los frenos que encontró. */
export type ApplyTap = { counted: boolean; stops: ApplyStop[] }

const NEW_TAP: ApplyTap = { counted: false, stops: [] }
const NEW = 'nuevo'
const COUNTED = 'contado'
const STOP_SLUGS: Record<ApplyStop, string> = {
  phone: 'telefono',
  identity: 'identidad',
  limit: 'tope',
  not_receiving: 'no-recibe',
}
const STOPS: ApplyStop[] = ['phone', 'identity', 'limit', 'not_receiving']
const SEPARATOR = '.'

function stopOf(slug: string): ApplyStop | undefined {
  return STOPS.find((stop) => STOP_SLUGS[stop] === slug)
}

/** Una marca que no se entiende no viene de un toque: no se cuenta nada, como sin marca. */
export function parseTap(value: string | undefined): ApplyTap | null {
  if (value === undefined) return null
  if (value === NEW) return NEW_TAP
  if (value === COUNTED) return { counted: true, stops: [] }
  const stops = value.split(SEPARATOR).map(stopOf)
  return stops.every((stop) => stop !== undefined) ? { counted: true, stops } : null
}

function tapValue(tap: ApplyTap): string {
  if (!tap.counted) return NEW
  return tap.stops.length === 0
    ? COUNTED
    : tap.stops.map((stop) => STOP_SLUGS[stop]).join(SEPARATOR)
}

export function withTap(path: string, tap: ApplyTap): string {
  return `${path}${path.includes('?') ? '&' : '?'}${TAP_FLAG}=${tapValue(tap)}`
}

/** El enlace de «Quiero adoptar» en la ficha de un animal o de una cría: un toque sin contar. */
export function tappedApplyPath(path: string): string {
  return withTap(path, NEW_TAP)
}

/**
 * Lo que se cuenta al abrir la pantalla de solicitar con esta marca, y la marca que sigue viaje si
 * la persona tiene que ir a otro lado antes del cuestionario. Sin sesión todavía no hay freno.
 */
export function tapEvents(
  tap: ApplyTap | null,
  tapped: TrackedEvent,
  stopped: ApplyStoppedEvent | null,
): { events: TrackedEvent[]; next: ApplyTap | null } {
  if (tap === null) return { events: [], next: null }
  const stop = stopped !== null && !tap.stops.includes(stopped.props.by) ? stopped : null
  return {
    events: [...(tap.counted ? [] : [tapped]), ...(stop === null ? [] : [stop])],
    next: { counted: true, stops: stop === null ? tap.stops : [...tap.stops, stop.props.by] },
  }
}
