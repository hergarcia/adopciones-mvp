export type SaveFailure =
  | 'offline'
  | 'site'
  | 'session'
  | 'level'
  | 'changed_elsewhere'
  | 'not_found'
  | 'photos_invalid'
  | 'invalid'
  | 'duplicate_name'

const BY_ERROR: Record<string, SaveFailure> = {
  'pets.errors.session': 'session',
  'pets.errors.needs_verification': 'level',
  'pets.errors.changed_elsewhere': 'changed_elsewhere',
  'pets.errors.not_found': 'not_found',
  'pets.errors.photos_invalid': 'photos_invalid',
  'pets.errors.invalid': 'invalid',
  'pets.errors.duplicate_name': 'duplicate_name',
}

type Outcome = {
  /** La llamada no llegó a responder: se cortó la red o el sitio no contestó. */
  rejected: boolean
  online: boolean
  /** Pasaron los 2 minutos: aunque después llegue una respuesta, ya no se espera (FR-018). */
  timedOut: boolean
  result?: { ok: boolean; error?: string }
}

// Sin conexión y «el sitio no respondió» tienen mensajes distintos (FR-021); lo demás es la clave
// que devolvió la acción. Una clave que no tiene un camino propio es que el sitio falló.
export function classifySaveOutcome({
  rejected,
  online,
  timedOut,
  result,
}: Outcome): SaveFailure | 'ok' {
  if (timedOut) return 'site'
  if (rejected || result === undefined) return online ? 'site' : 'offline'
  if (result.ok) return 'ok'
  return BY_ERROR[String(result.error)] ?? 'site'
}
