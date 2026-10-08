type Props = {
  /** Por quién es y quién la mandó, con el sello del estado. */
  head: React.ReactNode
  /** El contacto y la oferta de «En proceso», cuando está aceptada; o nada. */
  contact: React.ReactNode
  /** Lo que contestó y lo que le preguntó. */
  body: React.ReactNode
  /** La decisión: responder, o dejar sin efecto la aceptación; o nada. */
  actions: React.ReactNode
}

// Una solicitud para el publicador, la ficha de la entrevista: en el teléfono una columna en el
// orden de lectura —quién es, lo que contestó, la decisión al pie—; desde 1024, quién es y la
// decisión a la izquierda, la decisión quieta mientras se lee, y lo que contestó a la derecha, así
// la hoja se llena (docs/10 §Pantallas anchas). La fila de la decisión es la que crece: dentro de
// ella `sticky` tiene por dónde moverse.
export function PublisherApplicationLayout({ head, contact, body, actions }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-[var(--container-rail)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12">
      <div className="lg:col-start-1 lg:row-start-1">{head}</div>
      {contact === null ? null : <div className="lg:col-start-1 lg:row-start-2">{contact}</div>}
      <div className="flex flex-col gap-8 lg:col-start-2 lg:row-span-3 lg:row-start-1">{body}</div>
      {actions === null ? null : (
        <div className="lg:sticky lg:top-gutter-wide lg:col-start-1 lg:row-start-3 lg:self-start">
          {actions}
        </div>
      )}
    </div>
  )
}
