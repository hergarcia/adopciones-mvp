export type MailTransport = 'resend' | 'outbox' | 'none'

// Por dónde sale un correo. Sin clave de Resend, en local y en las pruebas va a archivo, de donde lo
// leen los e2e (KL-006). En el sitio de verdad no: un enlace de ingreso escrito en el disco del
// servidor es una sesión que nadie pidió guardar, así que sin clave no sale y se dice (#356).
export function mailTransport(env: {
  apiKey?: string | undefined
  deployEnv?: string | undefined
}): MailTransport {
  if (env.apiKey !== undefined) return 'resend'
  return env.deployEnv === undefined ? 'outbox' : 'none'
}
