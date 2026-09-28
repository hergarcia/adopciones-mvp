type Props = {
  /** Foto, nombre, zona y si rescata. */
  header: React.ReactNode
  /** «En el sitio desde…». */
  since: React.ReactNode
  /** La chapita con su texto, o la nota sin nivel: nunca falta. */
  level: React.ReactNode
  /** Quienes responden y el lugar de avalar, si los hay. */
  children?: React.ReactNode
}

// El perfil público en una columna, en el orden en que se pregunta en el grupo —¿quién es?, ¿es
// real?, ¿quién la conoce?—, y desde 1024 en dos: quién es a la izquierda y qué tan verificada está
// a la derecha, que nunca queda vacía porque siempre tiene el nivel (docs/10 §Pantallas anchas: se
// agregan columnas, no se rediseña). Debajo de 1024 las columnas son `contents` y `order` arma la
// única columna.
export function PublicProfileLayout({ header, since, level, children }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
      <div className="contents lg:flex lg:flex-col lg:gap-6">
        <div className="order-1 lg:order-none">{header}</div>
        <div className="order-3 lg:order-none">{since}</div>
      </div>
      <div className="contents lg:flex lg:flex-col lg:gap-8">
        <div className="order-2 lg:order-none">{level}</div>
        {children ? (
          <div className="order-4 flex flex-col gap-8 lg:order-none">{children}</div>
        ) : null}
      </div>
    </div>
  )
}
