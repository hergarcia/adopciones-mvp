import { cn } from '@/lib/cn'

/** Ya traducida. `soon`: vence en 7 días o menos, y es lo que le toca hacer al publicador. */
export type ExpiryLine = { text: string; soon: boolean }

// La letra chica al pie del cartel (plan #59 §Diseño): cuándo vence. La próxima en mate cocido,
// porque le toca actuar al publicador (docs/10, `--color-warning`).
export function PetExpiryLine({ line }: { line: ExpiryLine }) {
  return (
    <p className={cn('text-sm', line.soon ? 'font-bold text-warning' : 'text-ink-muted')}>
      {line.text}
    </p>
  )
}
