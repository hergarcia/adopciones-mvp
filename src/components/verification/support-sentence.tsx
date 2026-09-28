type Props = {
  /** La frase entera, con `{email}` donde va la dirección de ayuda, o sin ella. */
  template: string
  email: string
}

// La frase está entera en los mensajes; se parte solo para que la dirección de ayuda sea un enlace
// que abre el correo (FR-027, FR-017).
export function SupportSentence({ template, email }: Props) {
  const [before, after] = template.split('{email}')
  if (after === undefined) return <>{template}</>
  return (
    <>
      {before}
      <a
        href={`mailto:${email}`}
        className="font-medium text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
      >
        {email}
      </a>
      {after}
    </>
  )
}
