type Props = {
  /** Ya traducidos. Van juntas a propósito: decir solo la primera haría dar el número creyendo que
   *  queda privado para siempre (FR-004). */
  private: string
  revealed: string
}

// La yerba va solo en la mitad privada, como en `PersonalDataNotice`: en verde, "lo va a ver la
// otra persona" se leería como una garantía.
export function PhonePrivacyNotice({ private: hidden, revealed }: Props) {
  return (
    <p className="text-sm text-ink-muted">
      <span className="text-primary">{hidden}</span> {revealed}
    </p>
  )
}
