import { FormNote } from './form-note'

// Antes de la tirita: el contacto se da cuando la solicitud se acepta, nunca antes (FR-023).
export function ContactLaterNote({ text }: { text: string }) {
  return <FormNote>{text}</FormNote>
}
