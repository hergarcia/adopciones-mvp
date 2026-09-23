/** Las dos formas del mismo mensaje, con `{seconds}` adentro de la de plural. */
export type SecondForms = { one: string; many: string }

// Una cuenta que baja hasta uno termina diciendo «en 1 segundos» si el número se sustituye a
// secas. Las dos formas viajan desde el servidor y la elección la hace el cliente, que es el
// único que tiene el número.
export function inSeconds(seconds: number, forms: SecondForms): string {
  if (seconds === 1) return forms.one
  return forms.many.replace('{seconds}', String(seconds))
}

/** Las dos formas de "te queda(n) N intento(s)", con `{attempts}` adentro de la de plural. */
export type AttemptForms = { one: string; many: string }

// El mismo problema que la cuenta regresiva: «te quedan 1 intentos» si el número se sustituye a
// secas. Los intentos llegan en la respuesta de la acción, así que la elección es del cliente.
export function inAttempts(attempts: number, forms: AttemptForms): string {
  if (attempts === 1) return forms.one
  return forms.many.replace('{attempts}', String(attempts))
}
