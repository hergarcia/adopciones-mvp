import { useId } from 'react'
import { ErrorText } from './error-text'

type Props = {
  /** Mensaje de error, ya traducido. */
  error?: string
  /** Recibe el id del error para atarlo al control con `aria-describedby`. */
  children: (errorId: string | undefined) => React.ReactNode
}

// El id sale de `useId` y no del `id` del campo: el vínculo entre el control y su error no puede
// depender de una prop opcional.
export function FieldShell({ error, children }: Props) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      {children(errorId)}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
