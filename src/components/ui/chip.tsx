import { cn } from '@/lib/cn'

type Props = {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

// Filtro. Inactivo sobre la superficie; activo pasa a primary-soft con borde primario
// (docs/10 §Componentes). El objetivo táctil llega a 44 px por el padding vertical.
export function Chip({ label, active = false, onClick, className }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'press rounded-pill border px-4 py-2.5 text-sm transition-colors duration-[var(--dur-fast)] ease-out',
        active
          ? 'border-primary bg-primary-soft text-ink'
          : 'border-line bg-surface text-ink-muted hover:text-ink',
        className,
      )}
    >
      {label}
    </button>
  )
}
