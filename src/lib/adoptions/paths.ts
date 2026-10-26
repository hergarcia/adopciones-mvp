import { myApplicationPath } from '@/lib/applications/paths'
import { litterPanelPath } from '@/lib/litters/paths'
import { MY_PETS_PATH, myPetPath } from '@/lib/pets/paths'

/** La marca de la pantalla a la que se vuelve después de marcar adoptado: el aviso de cómo quedó. */
export const HANDED_OVER_FLAG = 'adoptado'

const LITTER_PANEL = new RegExp(`^${litterPanelPath('[0-9a-f-]{36}')}$`)

// A dónde vuelve «¿A quién se lo diste?»: solo Mis animales, la pantalla de ese animal o, de una
// cría, el panel de una camada, que son desde donde se abre (contracts §Rutas); cualquier otra cosa,
// Mis animales. El panel de otra camada no es de esta cría, pero solo muestra lo propio.
export function handoverReturnPath(petId: string, asked: string | null | undefined): string {
  if (asked === myPetPath(petId)) return asked
  return asked !== null && asked !== undefined && LITTER_PANEL.test(asked) ? asked : MY_PETS_PATH
}

export function handoverPath(petId: string, back: string): string {
  const volver = encodeURIComponent(handoverReturnPath(petId, back))
  return `${myPetPath(petId)}/adoptado?volver=${volver}`
}

/** La vuelta con el aviso de que quedó adoptado. */
export function handedOverPath(petId: string, back: string): string {
  return `${handoverReturnPath(petId, back)}?${HANDED_OVER_FLAG}=${petId}`
}

/** La marca de Mi solicitud después de aceptar el compromiso: el aviso «Aceptaste el compromiso». */
export const COMMITTED_FLAG = 'compromiso'

export function committedPath(applicationId: string): string {
  return `${myApplicationPath(applicationId)}?${COMMITTED_FLAG}=1`
}

/** La marca de Mi solicitud después de «Yo no adopté»: el aviso de que quien lo dio se va a enterar. */
export const DECLINED_FLAG = 'no-adopte'

export function declinedPath(applicationId: string): string {
  return `${myApplicationPath(applicationId)}?${DECLINED_FLAG}=1`
}
