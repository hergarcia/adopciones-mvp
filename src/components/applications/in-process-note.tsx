import { FormNote } from './form-note'

// El publicador ya está avanzando con otra persona: la solicitud queda por si no se concreta (FR-005).
export function InProcessNote({ text }: { text: string }) {
  return <FormNote>{text}</FormNote>
}
