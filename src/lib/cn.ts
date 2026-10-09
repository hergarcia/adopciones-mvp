import { clsx, type ClassValue } from 'clsx'

// Junta clases y no resuelve conflictos: sin tailwind-merge, que pesaba 8,5 KB en cada pantalla
// (docs/07, decisión 2026-10-09). Una clase de quien llama no pisa una del componente; lo que
// cambia el componente entra como variante.
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
