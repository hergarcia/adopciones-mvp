type Props = {
  /** Ya traducidos. Las tres frases van juntas a propósito: decir solo que el correo es privado
   *  haría cargar la cara y el barrio creyendo que también lo son (FR-027a). */
  stored: string
  emailPrivate: string
  willBePublic: string
}

export function PersonalDataNotice({ stored, emailPrivate, willBePublic }: Props) {
  return (
    <p className="text-sm text-ink-muted">
      {stored} <span className="text-primary">{emailPrivate}</span> {willBePublic}
    </p>
  )
}
