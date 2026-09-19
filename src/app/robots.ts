import type { MetadataRoute } from 'next'

// Nada se indexa hasta que exista el dominio definitivo (docs/04-nombre.md): mudar de dominio
// después tira la autoridad acumulada, y hoy no hay producto que ofrecerle a un buscador. La
// indexación se prende en M5, con el nombre real, junto con el sitemap (docs/09 §M5).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
