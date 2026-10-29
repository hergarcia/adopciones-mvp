type Input = {
  zone: string
  adopted: boolean
  /** El nivel de quien publicó en las palabras de la ficha, o null si no se pudo saber. */
  level: string | null
}

type Texts = {
  listing: string
  withLevel: (zone: string, level: string) => string
}

/**
 * El texto debajo del título de la vista previa de un animal o una camada (historia #244): la zona y
 * el nivel; adoptado, el nivel sin la zona. Sin nivel queda el de antes: un nivel que no se sabe no
 * se adivina.
 */
export function shareDescription({ zone, adopted, level }: Input, texts: Texts): string {
  if (adopted) return level ?? texts.listing
  return level === null ? zone : texts.withLevel(zone, level)
}
