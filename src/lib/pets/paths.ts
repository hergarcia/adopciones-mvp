export const MY_PETS_PATH = '/mis-animales'
export const PUBLISH_PATH = '/mis-animales/publicar'

/** Un animal en «Mis animales», con sus acciones a la vista (historia #59). */
export function myPetPath(petId: string): string {
  return `${MY_PETS_PATH}/${petId}`
}

export function editPetPath(petId: string): string {
  return `${MY_PETS_PATH}/${petId}/editar`
}

export const LISTING_PATH = '/animales'

/** La ficha pública: el código y nada más, así no cambia al editar (FR-010). */
export function petPath(code: string): string {
  return `${LISTING_PATH}/${code}`
}

// La versión cambia con la portada, el nombre o la zona: las apps que arman la vista previa piden
// la imagen nueva en vez de mostrar la que ya tenían guardada (FR-011).
export function petShareImagePath(code: string, version: string): string {
  return `${petPath(code)}/imagen?v=${version}`
}

/** El cartel para el estado y las historias, solo para quien lo publicó (historia #275). */
export function petPosterPath(code: string): string {
  return `${petPath(code)}/cartel`
}

/** La portada sola y cuadrada, para el correo de avisos; se ve mientras se ve la ficha (#267). */
export function petMailPhotoPath(code: string, version: string): string {
  return `${petPath(code)}/foto?v=${version}`
}

const RENEWAL_PATH = '/sigue-disponible'

/** «Sigue disponible» del recordatorio: el token y nada más, sin nada de la persona (FR-020). */
export function renewalPath(token: string): string {
  return `${RENEWAL_PATH}/${token}`
}

/** La pantalla que solo lee: recargarla no renueva de nuevo (research R5). */
export function renewalResultPath(token: string, outcome: string): string {
  return `${renewalPath(token)}/listo?r=${outcome}`
}

export function renewalPhotoPath(token: string): string {
  return `${renewalPath(token)}/foto`
}

/** La lista de quien administra (historia #59, US4). */
export const PET_REVIEW_PATH = '/revision/publicaciones'
