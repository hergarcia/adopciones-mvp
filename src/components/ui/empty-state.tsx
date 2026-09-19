import { cn } from '@/lib/cn'

type Props = {
  /** Una frase, ya traducida. Invita a actuar; no describe un vacío. */
  title: string
  /** La acción. Ya traducida, con su handler. */
  action?: React.ReactNode
  className?: string
}

// El poste con un cartel en blanco, una frase, una acción. Centrado, que es una de las dos
// excepciones a la alineación a la izquierda (docs/10 §Layout).
export function EmptyState({ title, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-6 text-center', className)}>
      <BlankPoster />
      <p className="max-w-[30ch] text-base text-ink-muted">{title}</p>
      {action}
    </div>
  )
}

// Trazo simple en tinta con un toque de yerba, el mismo estilo en todos los vacíos, SVG inline
// (docs/10 §Fotos e ilustraciones). El cartel está en blanco y con sus tiritas intactas: todavía
// nadie pegó nada.
function BlankPoster() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 120"
      className="h-28 w-auto fill-none stroke-ink"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M74 118V6h12v112" />
      <g transform="rotate(-3 80 54)">
        <rect x="50" y="20" width="60" height="62" className="fill-canvas" />
        <path d="M59 33h42M59 43h27" />
        <rect x="62" y="51" width="36" height="21" className="stroke-primary" />
        <path d="M50 82v12M60 82v12M70 82v12M80 82v12M90 82v12M100 82v12M110 82v12" />
      </g>
    </svg>
  )
}
