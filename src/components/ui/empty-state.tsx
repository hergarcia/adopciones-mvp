import { cn } from '@/lib/cn'

type Props = {
  /** Una frase, ya traducida. Invita a actuar; no describe un vacío. */
  title: string
  /** La acción. Ya traducida, con su handler. */
  action?: React.ReactNode
  className?: string
}

// Ilustración chica, una frase, una acción. Centrado, que es una de las dos excepciones a la
// alineación a la izquierda (docs/10 §Layout). Un spinner genérico no es un estado diseñado.
export function EmptyState({ title, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-line px-4 py-8 text-center',
        className,
      )}
    >
      <Illustration />
      <p className="max-w-[var(--measure)] text-base text-ink-muted">{title}</p>
      {action}
    </div>
  )
}

// Trazo simple en tinta con un toque de primario, el mismo estilo en todos los vacíos, máximo
// 200 px de alto, SVG inline (docs/10 §Fotos e ilustraciones).
function Illustration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 96 72"
      className="h-20 w-auto"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 60h72" className="text-line" />
      <path d="M30 60V34l18-14 18 14v26" className="text-ink" />
      <path d="M42 60V46h12v14" className="text-ink" />
      <circle cx="70" cy="22" r="6" className="text-primary" />
    </svg>
  )
}
