import { safeDestination } from '@/lib/auth/next-destination'
import { hasPending, isLevelOne, type PhoneStatus } from './phone-status'

export type GateReason = 'publish' | 'apply'

/** La puerta tal como viaja en la URL: para qué acción, a dónde volver y desde dónde se llegó. */
export type Gate = { reason: GateReason | null; next: string | null; from: string | null }

export const NO_GATE: Gate = { reason: null, next: null, from: null }

const VERIFY_PATH = '/verificar-telefono'
const CODE_PATH = '/verificar-telefono/codigo'
const PROFILE_PATH = '/mi-perfil'
const REASONS: readonly GateReason[] = ['publish', 'apply']
const REASON_SLUG: Record<GateReason, string> = { publish: 'publicar', apply: 'solicitar' }

// Una ruta de este sitio o nada. Es la misma validación de la historia #9 (FR-014), pero acá hace
// falta saber si valió: sin destino válido, cada caso cae en un lugar distinto.
export function validPath(candidate: string | null | undefined): string | null {
  return safeDestination(candidate) === candidate ? candidate : null
}

export function parseGate(params: { para?: string; next?: string; desde?: string }): Gate {
  const reason = REASONS.find((key) => REASON_SLUG[key] === params.para) ?? null
  return { reason, next: validPath(params.next), from: validPath(params.desde) }
}

function withGate(path: string, gate: Gate): string {
  const query = new URLSearchParams()
  if (gate.reason !== null) query.set('para', REASON_SLUG[gate.reason])
  if (gate.next !== null) query.set('next', gate.next)
  if (gate.from !== null) query.set('desde', gate.from)
  const search = query.toString()
  return search === '' ? path : `${path}?${search}`
}

export function verifyPath(gate: Gate): string {
  return withGate(VERIFY_PATH, gate)
}

export function codePath(gate: Gate): string {
  return withGate(CODE_PATH, gate)
}

// Adónde va quien acaba de verificar: a la acción que tocó, o a «Mi perfil» con la confirmación
// (FR-013b, FR-018a). No `safeDestination` a secas, que devuelve el perfil sin la marca.
export function verifiedDestination(gate: Gate): string {
  return gate.next ?? `${PROFILE_PATH}?guardado=telefono`
}

// «Ahora no»: a la pantalla desde la que tocó la acción, o al inicio (FR-013e).
export function notNowDestination(gate: Gate): string {
  return gate.from ?? '/'
}

// La vuelta después de cancelar, a la misma pantalla y con la marca del aviso (FR-015a). La ruta
// puede traer ya su consulta, la de la puerta.
export function cancelReturnPath(from: string | null, ok: boolean): string {
  const url = new URL(validPath(from) ?? PROFILE_PATH, 'http://sitio')
  url.searchParams.set(ok ? 'guardado' : 'error', ok ? 'cancelado' : 'cancelar')
  return `${url.pathname}${url.search}`
}

export type GateCheck = { pass: true } | { pass: false; gatePath: string }

// La compuerta de publicar y solicitar. Con nivel 1 no agrega nada (FR-013d); sin él, al aviso con
// la acción, la vuelta y el origen.
export function gateCheck(
  status: PhoneStatus,
  request: { path: string; reason: GateReason; from?: string | null },
): GateCheck {
  if (isLevelOne(status)) return { pass: true }
  const gate = {
    reason: request.reason,
    next: validPath(request.path),
    from: validPath(request.from),
  }
  return { pass: false, gatePath: verifyPath(gate) }
}

export type ScreenRoute = { render: true } | { render: false; redirect: string }

// «Verificar teléfono»: abierta como aviso por alguien que ya tiene nivel 1 —porque ya se había
// verificado, o porque acaba de cancelar un cambio—, la puerta la deja pasar sin mostrar nada
// (FR-013d, FR-015a). Sin un destino válido, a donde estaba o a su perfil sin marca: no pasó nada
// que anunciar.
export function gateScreen(status: PhoneStatus, gate: Gate): ScreenRoute {
  if (gate.reason !== null && isLevelOne(status)) {
    return { render: false, redirect: gate.next ?? gate.from ?? PROFILE_PATH }
  }
  return { render: true }
}

// «Escribir el código» existe solo con un número a medias. Si no lo hay, a verificar con la misma
// puerta, o a su destino si ya está verificada.
export function codeScreen(status: PhoneStatus, gate: Gate): ScreenRoute {
  if (hasPending(status)) return { render: true }
  if (isLevelOne(status) && gate.next !== null) return { render: false, redirect: gate.next }
  return { render: false, redirect: verifyPath(gate) }
}
