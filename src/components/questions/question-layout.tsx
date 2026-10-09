type Props = {
  title: string
  article: React.ReactNode
  closing: React.ReactNode
}

// Una columna en el teléfono. Desde 1024 el cierre va al costado de la respuesta, fijo al bajar,
// porque una columna de lectura sola en la hoja de 1200 deja la mitad vacía (docs/10 §Pantallas
// anchas); en el DOM sigue después del artículo, así se lee al final (FR-003).
export function QuestionLayout({ title, article, closing }: Props) {
  return (
    <article>
      <h1 className="afiche max-w-[var(--measure)] text-2xl text-ink">{title}</h1>
      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,var(--measure))_minmax(0,1fr)] lg:items-start lg:gap-x-16">
        {article}
        <aside className="mt-10 lg:sticky lg:top-6 lg:mt-0">{closing}</aside>
      </div>
    </article>
  )
}
