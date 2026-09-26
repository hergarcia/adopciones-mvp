type Props = {
  /** Ya traducido: cómo sacarla, en texto al lado del dibujo. */
  description: string
}

// El ejemplo de la selfie: un dibujo y no la foto de una persona real (FR-005). Está pegado con
// cinta porque es eso, algo que alguien pegó al lado del hueco; el texto va afuera, porque lo
// pegado no lleva texto de lectura adentro (docs/10 §Recursos del cartel). Trazo de tinta con un
// toque de yerba, como las ilustraciones de los vacíos.
export function SelfieExample({ description }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="cinta shrink-0 rotate-[var(--tilt)] border-2 border-ink bg-canvas p-2">
        <svg
          aria-hidden
          viewBox="0 0 120 160"
          className="h-40 w-auto fill-none stroke-ink"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 158c2-26 14-40 34-42h4c16 2 26 10 30 22" />
          <ellipse cx="50" cy="72" rx="22" ry="27" />
          <path d="M40 68h.01M60 68h.01M43 84c4 3 10 3 14 0" />
          <path d="M28 60c2-18 12-26 22-26s20 8 22 24" />
          <g transform="rotate(-6 96 84)">
            <rect x="76" y="66" width="38" height="26" className="fill-canvas" />
            <rect x="80" y="71" width="11" height="15" className="stroke-primary" />
            <path d="M96 74h13M96 81h9" />
          </g>
          <path d="M88 116c0-8 2-16 6-22l4-4" />
          <path d="M78 94c4 6 10 8 16 6" />
        </svg>
      </div>
      <p className="text-sm text-ink-muted">{description}</p>
    </div>
  )
}
