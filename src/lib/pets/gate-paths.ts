import { validPath, verifyPath } from '@/lib/verification/gate'
import { MY_PETS_PATH, PUBLISH_PATH } from './paths'

// Aparte de las rutas: las pantallas que solo enlazan a «Mis animales» no tienen por qué bajar la
// puerta de verificación al navegador (historia #304).

/** La puerta de publicar y editar: la vuelta a esa pantalla, y «Ahora no» a «Mis animales». */
export function petGateRequest(path: string) {
  return { path, reason: 'publish' as const, from: MY_PETS_PATH }
}

/** El aviso de verificación pendiente con la vuelta a esa pantalla. */
export function petGatePath(path: string): string {
  return verifyPath({ reason: 'publish', next: validPath(path), from: MY_PETS_PATH })
}

// La pantalla desde la que el formulario llamó, para volver a ella: solo rutas propias de «Mis
// animales», y publicar si no vino ninguna que sirva.
export function petScreenPath(asked: string): string {
  const path = validPath(asked)
  return path?.startsWith(`${MY_PETS_PATH}/`) ? path : PUBLISH_PATH
}
