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

// El perfil público en el orden en que se pregunta en el grupo —¿quién es?, ¿es real?, ¿quién la
// conoce?—. La chapita califica al nombre, así que va pegada a él: desde 1024, a su lado y alineada
// con su último renglón, no en la otra mitad de la hoja (docs/10, PublicProfileLayout). Quién
// responde ocupa el ancho de la hoja debajo, y el lugar de avalar cierra.
export function PublicProfileLayout({ header, since, level, vouchers, slot }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-12">
          <div className="min-w-0">{header}</div>
          <div className="min-w-0">{level}</div>
        </div>
        {since}
      </div>
      {vouchers}
      {/* Sus frases en la medida de lectura aunque vaya a lo ancho de la hoja. */}
      <div className="max-w-[var(--measure)] empty:hidden">{slot}</div>
    </div>
  )
}
