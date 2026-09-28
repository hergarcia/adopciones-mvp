type Props = {
  /** Ya traducidas: qué es un aval, y cómo pedirlo o qué falta para recibirlo. */
  lines: string[]
  /** Copiar el enlace, o el paso que falta; nada si ya se ofreció arriba. */
  action?: React.ReactNode
}

// El vacío de una lista de «Mis avales»: nunca invita a pedir un aval a quien todavía no puede
// recibirlo (FR-025), y la acción del paso que falta aparece una sola vez en la pantalla.
export function MyVouchesEmpty({ lines, action }: Props) {
  return (
    <div className="flex flex-col items-start gap-3 bg-surface p-4">
      {lines.map((line) => (
        <p key={line} className="text-base text-ink">
          {line}
        </p>
      ))}
      {action}
    </div>
  )
}
