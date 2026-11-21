import { CODE_LENGTH } from './rules'

export const COMPLETE_CODE = new RegExp(`^\\d{${CODE_LENGTH}}$`)

// Espacios y guiones se ignoran: así llega un código pegado de un mensaje o sugerido por el
// teléfono (FR-007b).
export function stripCodeSeparators(value: string): string {
  return value.replaceAll(/[\s-]/g, '')
}

// Lo que el renglón manda solo, o nulo. Cada revisión gasta un intento, así que el mismo código no
// sale dos veces sin que la persona toque «Verificar» (historia #308).
export function codeToAutoCheck(value: string, lastChecked: string | null): string | null {
  const code = stripCodeSeparators(value)
  if (!COMPLETE_CODE.test(code) || code === lastChecked) return null
  return code
}
