/** Las dos formas del mismo mensaje, con `{seconds}` adentro de la de plural. */
export type SecondForms = { one: string; many: string }

// Una cuenta que baja hasta uno termina diciendo «en 1 segundos» si el número se sustituye a
// secas. Las dos formas viajan desde el servidor y la elección la hace el cliente, que es el
// único que tiene el número.
export function inSeconds(seconds: number, forms: SecondForms): string {
  if (seconds === 1) return forms.one
  return forms.many.replace('{seconds}', String(seconds))
}
