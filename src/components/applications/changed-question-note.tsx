import { FormNote } from './form-note'

type Props = {
  /** Ya traducido: «Carla cambió su pregunta mientras escribías…», o null sin aviso. */
  note: string | null
  /** Lo que había escrito para la anterior, con su rótulo, o null si no escribió nada. */
  previous: { label: string; text: string } | null
  /** El campo de la pregunta de hoy. */
  children: React.ReactNode
}

// La pregunta propia cambió mientras escribía (historia #292, research R4): el aviso arriba de la
// pregunta nueva y lo que había escrito debajo del campo, como texto que se puede seleccionar y
// copiar, no como otro campo.
export function ChangedQuestionNote({ note, previous, children }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {note === null ? null : <FormNote live>{note}</FormNote>}
      {children}
      {previous === null ? null : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-muted">{previous.label}</p>
          <p className="bg-surface p-4 text-base break-words whitespace-pre-line text-ink select-text">
            {previous.text}
          </p>
        </div>
      )}
    </div>
  )
}
