import { MY_PETS_PATH, PUBLISH_PATH } from '@/lib/pets/paths'

export const LITTERS_PATH = '/camadas'
export const PUBLISH_KIND_PARAM = 'tipo'
export const PUBLISH_PET_PATH = `${PUBLISH_PATH}?${PUBLISH_KIND_PARAM}=animal`
export const PUBLISH_LITTER_PATH = `${PUBLISH_PATH}?${PUBLISH_KIND_PARAM}=camada`

/** La ficha pública de la camada: el código y nada más, como la de un animal (research R3). */
export function litterPath(code: string): string {
  return `${LITTERS_PATH}/${code}`
}

export function litterEditPath(litterId: string): string {
  return `${MY_PETS_PATH}/camadas/${litterId}/editar`
}
