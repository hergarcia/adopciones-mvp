const KNOWN = new Set([
  'needs_verification',
  'photos_invalid',
  'photo_taken',
  'not_found',
  'changed_elsewhere',
])

// Las funciones de pets lanzan con la clave como mensaje (errcode P0001). Cualquier otra falla
// —la base que no responde, un check que salta— es que no se pudo guardar.
export function dbErrorKey(error: { code?: string; message: string }): string {
  return error.code === 'P0001' && KNOWN.has(error.message)
    ? `pets.errors.${error.message}`
    : 'pets.errors.save_failed'
}
