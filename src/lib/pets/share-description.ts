type Input = {
  zone: string
  adopted: boolean
  /** La oración con el nivel de quien publicó, o null si no se pudo saber. */
  publisher: string | null
}

type Texts = {
  listing: string
  withPublisher: (zone: string, publisher: string) => string
}

/**
 * El texto debajo del título de la vista previa de un animal o una camada: la zona y el nivel de
 * quien publicó; adoptado, el nivel sin la zona. Un nivel que no se sabe no se adivina: sin él, solo
 * la zona, o «Animales en adopción» si fue adoptado.
 */
export function shareDescription({ zone, adopted, publisher }: Input, texts: Texts): string {
  if (adopted) return publisher ?? texts.listing
  return publisher === null ? zone : texts.withPublisher(zone, publisher)
}
