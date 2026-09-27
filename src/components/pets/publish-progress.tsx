import type { SaveProgress } from '@/hooks/use-pet-save'

type Props = {
  progress: SaveProgress | null
  /** Con `{done}` y `{total}`. */
  uploading: string
  sending: string
}

// Cuántas fotos van subidas de cuántas, y después «Publicando…» (FR-018), en texto y anunciado:
// es lo que cambia mientras la tirita está ocupada.
export function PublishProgress({ progress, uploading, sending }: Props) {
  const text =
    progress === null
      ? ''
      : progress.phase === 'sending'
        ? sending
        : uploading
            .replace('{done}', String(progress.done))
            .replace('{total}', String(progress.total))

  return (
    <output aria-live="polite" className="min-h-5 text-sm text-ink-muted">
      {text}
    </output>
  )
}
