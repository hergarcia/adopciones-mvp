import { createHash } from 'node:crypto'

type SiteShare = { siteName: string; phrase: string }

/** Lo que va en `?v=` de la imagen de la portada: cambia con el nombre o la frase, así las apps de
 * mensajería no siguen mostrando la vieja (FR-026). */
export function siteShareVersion({ siteName, phrase }: SiteShare): string {
  return createHash('sha256')
    .update(JSON.stringify([siteName, phrase]))
    .digest('hex')
    .slice(0, 8)
}
