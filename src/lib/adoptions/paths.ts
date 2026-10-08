import { MY_PETS_PATH, myPetPath } from '@/lib/pets/paths'

/** La marca de la pantalla a la que se vuelve después de marcar adoptado: el aviso de cómo quedó. */
export const HANDED_OVER_FLAG = 'adoptado'

// A dónde vuelve «¿A quién se lo diste?»: solo Mis animales o la pantalla de ese animal, que son
// desde donde se abre (contracts §Rutas); cualquier otra cosa, Mis animales.
export function handoverReturnPath(petId: string, asked: string | null | undefined): string {
  return asked === myPetPath(petId) ? asked : MY_PETS_PATH
}

export function handoverPath(petId: string, back: string): string {
  const volver = encodeURIComponent(handoverReturnPath(petId, back))
  return `${myPetPath(petId)}/adoptado?volver=${volver}`
}

/** La vuelta con el aviso de que quedó adoptado. */
export function handedOverPath(petId: string, back: string): string {
  return `${handoverReturnPath(petId, back)}?${HANDED_OVER_FLAG}=${petId}`
}
