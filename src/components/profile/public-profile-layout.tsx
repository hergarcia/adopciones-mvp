type Props = {
  /** Foto, nombre, zona y si rescata. */
  header: React.ReactNode
  /** «En el sitio desde…». */
  since: React.ReactNode
  /** La chapita con su texto, o la nota sin nivel: nunca falta. */
  level: React.ReactNode
  /** Quienes responden, o nulo si nadie avala todavía. */
  vouchers: React.ReactNode | null
  /** El lugar de avalar; puede no dibujar nada. */
  slot: React.ReactNode
}

// El perfil público en una columna, en el orden en que se pregunta en el grupo —¿quién es?, ¿es
// real?, ¿quién la conoce?—. Desde 1024 quién es y qué nivel tiene van lado a lado arriba, y quién
// responde ocupa el ancho de la hoja debajo, con el lugar de avalar después: con la lista a un
// costado, la otra columna quedaba vacía a lo largo de todos los avales. Sin avales, el lugar de
// avalar va debajo del nivel y ninguna columna queda sola (docs/10, PublicProfileLayout). Debajo de
// 1024 las columnas son `contents` y `order` arma la única.
export function PublicProfileLayout({ header, since, level, vouchers, slot }: Props) {
  // Sus frases en la medida de lectura aunque vaya a lo ancho de la hoja.
  const slotBlock = (
    <div className="order-4 max-w-[var(--measure)] empty:hidden lg:order-none">{slot}</div>
  )
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12 lg:gap-y-10">
      <div className="contents lg:flex lg:flex-col lg:gap-6">
        <div className="order-1 lg:order-none">{header}</div>
        <div className="order-3 lg:order-none">{since}</div>
      </div>
      {vouchers === null ? (
        <div className="contents lg:flex lg:flex-col lg:gap-8">
          <div className="order-2 lg:order-none">{level}</div>
          {slotBlock}
        </div>
      ) : (
        <>
          <div className="order-2 lg:order-none">{level}</div>
          <div className="order-4 flex flex-col gap-8 lg:order-none lg:col-span-2">
            {vouchers}
            {slotBlock}
          </div>
        </>
      )}
    </div>
  )
}
