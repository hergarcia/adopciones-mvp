import type { MetadataRoute } from 'next'
import { INDEXING_ENABLED } from '@/lib/config'
import { LISTING_PATH } from '@/lib/pets/paths'
import { LINK_PREVIEW_AGENTS } from '@/lib/analytics/link-preview'
import { QUESTIONS_PATH } from '@/lib/questions/paths'

// Nada se indexa hasta que exista el dominio definitivo (docs/04-nombre.md): mudar de dominio
// después tira la autoridad acumulada. La indexación se prende en M5, con el nombre real, junto
// con el sitemap (docs/09 §M5), cambiando `INDEXING_ENABLED`.
//
// Los lectores de vista previa sí entran al listado y a las fichas (historia #57, research R7): el de
// Facebook respeta este archivo, y con todo cerrado no arma la tarjeta del enlace compartido. Sin la
// barra final: robots.txt compara por prefijo, y `/animales/` dejaba afuera al listado mismo. La
// portada entra sola (`/$`, sin lo que cuelga de ella) con su imagen, para que el enlace del sitio
// pegado en un grupo también arme su tarjeta (historia #61). Las preguntas y su índice, igual que el
// listado, para que la pregunta pegada en WhatsApp llegue con su tarjeta (historia #8).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      INDEXING_ENABLED ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
      {
        userAgent: [...LINK_PREVIEW_AGENTS],
        allow: [LISTING_PATH, '/$', '/imagen', QUESTIONS_PATH],
        disallow: '/',
      },
    ],
  }
}
