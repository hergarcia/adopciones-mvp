type Props = {
  /**
   * Por la puerta de una acción, el título y la bajada nombran esa acción (FR-013a). La bajada
   * puede ser una `NumberSentence`.
   */
  texts: { title: string; lead: React.ReactNode }
  /** El id del título, para que otro lo nombre (`aria-labelledby`) o le lleve el foco. */
  id?: string
  /** Recibe el foco por código: cuando la pantalla cambia sin navegar, así se anuncia. */
  focusable?: boolean
}

export function VerifyHeading({ texts, id, focusable = false }: Props) {
  return (
    <>
      <h1
        id={id}
        tabIndex={focusable ? -1 : undefined}
        className="afiche text-2xl text-ink focus:outline-none"
      >
        {texts.title}
      </h1>
      {texts.lead ? <p className="mt-3 text-base text-ink-muted">{texts.lead}</p> : null}
    </>
  )
}
