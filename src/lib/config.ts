// El nombre es provisorio y vive solo acá: docs/04-nombre.md deja el nombre real sin definir y
// manda construir con un placeholder de texto. Cambiarlo es cambiar este archivo, nada más.
export const APP_NAME = 'Adopciones'

// `||` y no `??` a propósito: copiar .env.example deja `NEXT_PUBLIC_APP_URL=` vacío, y una cadena
// vacía tiene que contar como "sin definir". Con `??` pasaba tal cual y `new URL('')` reventaba el
// layout en un clon limpio.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// A dónde escribe quien necesita ayuda con su verificación de identidad (historia #11): el tope de
// intentos y la sospecha de fraude la nombran. Una sola dirección; hasta que exista el dominio
// (docs/04) la pone el equipo en el entorno, y sin ella queda una dirección reservada que no llega a
// nadie por accidente.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'ayuda@example.test'
