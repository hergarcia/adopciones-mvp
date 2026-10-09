type Props = {
  siteName: string
  siteUrl: string
  index: { title: string; path: string }
  page: { title: string; path: string; updatedOn: string }
}

// Datos estructurados a mano (docs/08 §Encontrable): la miga y el artículo con su fecha, que es lo
// que citan los motores generativos. Sin `FAQPage`: cada página es una pregunta.
export function QuestionJsonLd({ siteName, siteUrl, index, page }: Props) {
  const url = (path: string) => new URL(path, siteUrl).toString()
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { name: siteName, path: '/' },
        { name: index.title, path: index.path },
        { name: page.title, path: page.path },
      ].map((item, position) => ({
        '@type': 'ListItem',
        position: position + 1,
        name: item.name,
        item: url(item.path),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.title,
      dateModified: page.updatedOn,
      inLanguage: 'es-UY',
      mainEntityOfPage: url(page.path),
      publisher: { '@type': 'Organization', name: siteName, url: url('/') },
    },
  ]
  return (
    <script
      type="application/ld+json"
      // El texto es nuestro, pero un `<` cerraría el script: se escapa igual.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', '\\u003c') }}
    />
  )
}
