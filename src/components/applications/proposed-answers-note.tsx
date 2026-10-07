import { FormNote } from './form-note'

// Desde la segunda solicitud: avisa que lo escrito viene de la vez anterior, para revisarlo (FR-025).
export function ProposedAnswersNote({ text }: { text: string }) {
  return <FormNote>{text}</FormNote>
}
