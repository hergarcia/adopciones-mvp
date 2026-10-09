import type { ReactNode } from 'react'

type Props = {
  /** Ya traducido: «¿Algo para decirnos?». */
  prompt: string
  /** «Opinar», el mismo que arriba. */
  feedback: ReactNode
}

// El pie de todas las pantallas (plan §Diseño PaperFrame): la línea de Opinar, sobre piedra y
// separada por la línea punteada por donde se corta la tira de un cartel.
export function SiteFooter({ prompt, feedback }: Props) {
  return (
    <footer className="border-t-2 border-dashed border-ink bg-surface px-gutter py-6 md:px-gutter-wide">
      <div className="flex flex-wrap items-center gap-x-3 text-base text-ink">
        <span>{prompt}</span>
        {feedback}
      </div>
    </footer>
  )
}
