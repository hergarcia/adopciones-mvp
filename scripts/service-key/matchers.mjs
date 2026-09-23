// Qué cuenta como una clave privada expuesta o versionada. Lógica pura, con su test al lado: una
// compuerta de privacidad que nunca se vio fallar no es una compuerta.
const SERVICE_KEY_NAME = 'SUPABASE_SERVICE_ROLE_KEY'

// Las que en `.env.example` tienen que quedar sin valor. El ejemplo se versiona, así que un valor
// ahí es un secreto en git aunque el nombre sea el correcto.
const PRIVATE_NAMES = [SERVICE_KEY_NAME, 'RESEND_API_KEY', 'TWILIO_AUTH_TOKEN']

const EXPOSED_PREFIX = 'NEXT_PUBLIC_'

// Un nombre con el prefijo que viaja al browser y que además nombra una clave privada: la de
// servicio con cualquiera de sus nombres (`SERVICE_ROLE`, `SERVICE_KEY`), la `SECRET` nueva, o
// cualquier `API_KEY` —la de Resend manda correo en nombre del dominio, así que en el browser es
// un servidor de spam gratis—. `NEXT_PUBLIC_SUPABASE_ANON_KEY` no entra: no dice API_KEY y es
// justamente la que sí viaja.
// El token de Twilio manda mensajes pagos en nombre de la cuenta: en el browser es un bombeo de
// mensajes gratis para cualquiera.
const EXPOSED_NAME = new RegExp(
  `${EXPOSED_PREFIX}[A-Z0-9_]*(?:SERVICE|SECRET|API_KEY|AUTH_TOKEN)[A-Z0-9_]*`,
)
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g

// La clave `secret` nueva no es un JWT, pero saltea RLS igual que la de servicio, y el CLI local
// ya la imprime al lado.
const SECRET_KEY_VALUE = /sb_secret_[A-Za-z0-9_-]{20,}/

// La de Resend. La forma entera —prefijo, un tramo, guion bajo, otro tramo largo— y no solo `re_`,
// para no acusar a cualquier identificador que empiece igual. El corte de la izquierda va como
// clase negada y no como `\b`: un escape mal pasado deja un byte de control crudo en el archivo
// y el patrón deja de ser el que dice ser, que ya pasó una vez acá (67f8738).
const RESEND_KEY_VALUE = /(?:^|[^A-Za-z0-9])re_[A-Za-z0-9]{6,}_[A-Za-z0-9]{20,}/

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
    problems.push(`expone una clave privada al browser con el prefijo ${EXPOSED_PREFIX}`)
  }
  if (hasServiceRoleJwt(line) || SECRET_KEY_VALUE.test(line)) {
    problems.push('hay una clave de servicio escrita literal y versionada')
  }
  if (RESEND_KEY_VALUE.test(line)) {
    problems.push('hay una clave de Resend escrita literal y versionada')
  }
  if (file === '.env.example') {
    for (const name of PRIVATE_NAMES) {
      const assignment = `${name}=`
      if (line.startsWith(assignment) && line.trim() !== assignment) {
        problems.push(`.env.example trae un valor real en ${name}; tiene que quedar vacío`)
      }
    }
  }
  return problems
}
