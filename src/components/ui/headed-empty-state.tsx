import { EmptyState } from './empty-state'

type Props = {
  /** El `h1` en voz de afiche, ya traducido. */
  title: string
  /** La frase del `EmptyState`, ya traducida. */
  body: string
  action: React.ReactNode
}

// Una pantalla que no tiene otra cosa que decir: el `h1` centrado sobre el `EmptyState`, para que la
// pantalla nunca se quede sin encabezado (docs/10 §Piso de accesibilidad). Centrado sobre todo el
// ancho que le den: en la hoja, no en la columna de lectura.
export function HeadedEmptyState({ title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center">
      <h1 className="afiche text-center text-2xl text-ink">{title}</h1>
      <EmptyState title={body} action={action} />
    </div>
  )
}
