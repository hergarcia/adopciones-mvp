export type PetNotice = 'published' | 'edited'

const FLAGS: Record<string, PetNotice> = { publicado: 'published', editado: 'edited' }

/** La marca que deja el formulario al llegar a «Mis animales»: «Publicado» o «Guardado». */
export function petNotice(flag: string | null | undefined): PetNotice | null {
  return FLAGS[String(flag)] ?? null
}

export function withPetNotice(notice: PetNotice): string {
  return `/mis-animales?guardado=${notice === 'published' ? 'publicado' : 'editado'}`
}
