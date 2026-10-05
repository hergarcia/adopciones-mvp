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
  /** Reportar, bloquear, suspender: al pie y separado; nulo en el propio perfil. */
  safety?: React.ReactNode | null
}

// El perfil público en el orden en que se pregunta en el grupo —¿quién es?, ¿es real?, ¿quién la
// conoce?—. Desde 1024 la cabecera es la del afiche, a lo ancho de la hoja: quién es a la izquierda
// y el nivel como una banda que arranca pegada al nombre y llega al borde, alineada con su último
// renglón. Así un perfil sin avales, que en la beta es casi todos, no queda en la mitad izquierda
// de la hoja (docs/10, PublicProfileLayout). Quién responde va debajo, y el lugar de avalar cierra.
export function PublicProfileLayout({ header, since, level, vouchers, slot, safety }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-12">
          <div className="min-w-0">{header}</div>
          <div className="min-w-0 lg:flex-1">{level}</div>
        </div>
        {since}
      </div>
      {vouchers}
      {/* Sus frases en la medida de lectura aunque vaya a lo ancho de la hoja. */}
      <div className="max-w-[var(--measure)] empty:hidden">{slot}</div>
      {/* Las herramientas de trabajo van debajo de todo y separadas por una línea: el perfil
          existe para mostrar a la persona, no para acusarla (plan §Perfil público). */}
      {safety ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t-2 border-line pt-4 empty:hidden">
          {safety}
        </div>
      ) : null}
    </div>
  )
}
