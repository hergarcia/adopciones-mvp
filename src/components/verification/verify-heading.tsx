type Props = {
  /** Por la puerta de una acción, el título y la bajada nombran esa acción (FR-013a). */
  texts: { title: string; lead: string | null }
}

export function VerifyHeading({ texts }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      {texts.lead ? <p className="mt-3 text-base text-ink-muted">{texts.lead}</p> : null}
    </>
  )
}
