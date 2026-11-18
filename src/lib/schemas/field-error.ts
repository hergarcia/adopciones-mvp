import type { z } from 'zod'

/** Un error de campo: la clave, y el fragmento que citan los de contacto (FR-014 de la #53). */
export type FieldError = { key: string; values?: { fragment: string } }

export function toFieldError(issue: z.core.$ZodIssue): FieldError {
  // Solo un issue custom trae `params`; leído sin preguntar el tipo, los demás dan undefined.
  const params: { fragment?: string } | undefined = Reflect.get(issue, 'params')
  const fragment = params?.fragment
  return fragment === undefined
    ? { key: issue.message }
    : { key: issue.message, values: { fragment } }
}
