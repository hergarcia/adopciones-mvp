// Qué cuenta como la clave de servicio expuesta o versionada. Lógica pura, con su test al lado: una
// compuerta de privacidad que nunca se vio fallar no es una compuerta.
export const SERVICE_KEY_NAME = 'SUPABASE_SERVICE_ROLE_KEY'
const EXPOSED_PREFIX = 'NEXT_PUBLIC_'

// Un nombre con el prefijo que viaja al browser y que además nombra una clave privada: la de
// servicio con cualquiera de sus nombres (`SERVICE_ROLE`, `SERVICE_KEY`) o la `SECRET` nueva.
const EXPOSED_NAME = new RegExp(`${EXPOSED_PREFIX}[A-Z0-9_]*(?:SERVICE|SECRET)[A-Z0-9_]*`)
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g

function isServiceRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

// Todos los JWT del renglón, no el primero: `supabase status -o json` en una sola línea trae la
// clave anónima antes que la de servicio.
function hasServiceRoleJwt(line) {
  return [...line.matchAll(JWT)].some(([token]) => isServiceRole(token))
}

/** Los problemas de una línea de un archivo versionado. Vacío si no hay ninguno. */
export function problemsIn(file, line) {
  const problems = []
  if (EXPOSED_NAME.test(line)) {
    problems.push(`expone la clave de servicio al browser con el prefijo ${EXPOSED_PREFIX}`)
  }
  if (hasServiceRoleJwt(line)) {
    problems.push('hay una clave de servicio escrita literal y versionada')
  }
  const assignment = `${SERVICE_KEY_NAME}=`
  if (file === '.env.example' && line.startsWith(assignment) && line.trim() !== assignment) {
    problems.push('.env.example trae un valor real; tiene que quedar vacío')
  }
  return problems
}
