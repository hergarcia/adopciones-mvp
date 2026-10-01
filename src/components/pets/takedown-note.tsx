// El motivo de una baja, como lo lee su publicador: tal cual, sin quién la decidió (FR-029). Texto
// y no sello: el sello «Dado de baja» ya está sobre la foto.
export function TakedownNote({ text }: { text: string }) {
  return <p className="max-w-[var(--measure)] text-sm break-words text-ink">{text}</p>
}
