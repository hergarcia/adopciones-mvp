type Props = {
  /** Ya traducidas: «Adoptado por Ana» y, si hay compromiso, cómo está. */
  texts: { main: string; commitment: string | null }
}

// El talón de un adoptado en Mis animales y en su pantalla (plan §Mis animales): a quién se lo dio
// y el compromiso, debajo del sello, en chico. Qué renglón va lo decide `handoverLine`.
export function HandoverLine({ texts }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-ink">{texts.main}</p>
      {texts.commitment === null ? null : (
        <p className="text-sm text-ink-muted">{texts.commitment}</p>
      )}
    </div>
  )
}
