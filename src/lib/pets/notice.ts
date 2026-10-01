export type PetNotice = 'published' | 'edited' | 'deleted'

const FLAGS: Record<string, PetNotice> = {
  publicado: 'published',
  editado: 'edited',
  borrado: 'deleted',
}
const BY_NOTICE: Record<PetNotice, string> = {
  published: 'publicado',
  edited: 'editado',
  deleted: 'borrado',
}

/** La marca que deja una acción al llegar a «Mis animales»: «Publicado», «Guardado» o «Borrado». */
export function petNotice(flag: string | null | undefined): PetNotice | null {
  return FLAGS[String(flag)] ?? null
}

export function withPetNotice(notice: PetNotice): string {
  return `/mis-animales?guardado=${BY_NOTICE[notice]}`
}
