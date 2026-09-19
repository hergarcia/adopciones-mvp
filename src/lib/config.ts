// El nombre es provisorio y vive solo acá: docs/04-nombre.md deja el nombre real sin definir y
// manda construir con un placeholder de texto. Cambiarlo es cambiar este archivo, nada más.
export const APP_NAME = 'Adopciones'

// `||` y no `??` a propósito: copiar .env.example deja `NEXT_PUBLIC_APP_URL=` vacío, y una cadena
// vacía tiene que contar como "sin definir". Con `??` pasaba tal cual y `new URL('')` reventaba el
// layout en un clon limpio.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
