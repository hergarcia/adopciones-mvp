// Los pocos iconos que las primitivas necesitan, como SVG inline: docs/07 no registra ninguna
// librería de iconos, y estos son dos trazos. Sin texto adentro; la etiqueta accesible la pone
// quien los usa.
type IconProps = {
  className?: string
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className ?? 'size-4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className ?? 'size-4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className ?? 'size-4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  )
}
