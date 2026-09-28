import { validPath, verifyPath } from '@/lib/verification/gate'

export const MY_PETS_PATH = '/mis-animales'
export const PUBLISH_PATH = '/mis-animales/publicar'

export function editPetPath(petId: string): string {
  return `${MY_PETS_PATH}/${petId}/editar`
}

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
