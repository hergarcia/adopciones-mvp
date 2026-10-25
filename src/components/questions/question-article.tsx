type Props = {
  answer: string
  /** Las secciones propias, ya dibujadas, en el orden del registro. */
  sections: React.ReactNode[]
  /** Lo que la página toma de otras pantallas (niveles, cédula, compromiso), o nada. */
  shared: React.ReactNode
  /** Los atajos a las secciones, debajo de la respuesta, en la página que los tiene. */
  contents?: React.ReactNode
}

// La respuesta primero y sola, más grande que el detalle: es lo que se lee antes de decidir si
// seguir (FR-002). Lo compartido va después de la primera sección, que lo presenta.
export function QuestionArticle({ answer, sections, shared, contents }: Props) {
  const [first, ...rest] = sections
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <p className="text-lg text-ink">{answer}</p>
        {contents}
      </div>
      {first}
      {shared}
      {rest}
    </div>
  )
}
