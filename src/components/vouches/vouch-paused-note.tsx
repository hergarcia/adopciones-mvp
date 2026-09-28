// Un aval vigente que no cuenta: dice a quién le falta el nivel 2, nunca por qué (FR-025).
export function VouchPausedNote({ text }: { text: string }) {
  return <p className="text-sm text-ink-muted">{text}</p>
}
