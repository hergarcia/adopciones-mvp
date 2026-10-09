import type { ReactNode } from 'react'

type Line = {
  /** Ya traducido: «¿Algo para decirnos?», «¿Te trabaste?». */
  prompt: string
  /** El enlace de la línea. */
  action: ReactNode
}

type Props = {
  /** Opinar, el mismo que arriba. */
  feedback: Line
  /** El WhatsApp de soporte; sin número, nada (FR-031). */
  support: Line | null
}

// El pie de todas las pantallas (plan §Diseño PaperFrame): la línea de Opinar y, con número, la del
// WhatsApp de soporte, sobre piedra y separado por el divisor entre planos. No es la línea
// punteada: esa es la perforación de la tirita de la pantalla, y del pie no se arranca nada.
export function SiteFooter({ feedback, support }: Props) {
  return (
    <footer className="flex flex-col border-t-2 border-line bg-surface px-gutter py-6 md:px-gutter-wide">
      <FooterLine {...feedback} />
      {support === null ? null : <FooterLine {...support} />}
    </footer>
  )
}

function FooterLine({ prompt, action }: Line) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 text-base text-ink">
      <span>{prompt}</span>
      {action}
    </div>
  )
}
