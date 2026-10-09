import { clsx, type ClassValue } from 'clsx'

// Junta clases y no resuelve conflictos: una clase de quien llama no pisa una del componente; lo
// que cambia el componente entra como variante (docs/08 §Estilos).
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
