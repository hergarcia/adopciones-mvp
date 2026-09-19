import { cn } from '@/lib/cn'
import { field } from './field'
import { FieldShell, describedBy } from './field-shell'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  /** Mensaje de error, ya traducido. */
  error?: string
  className?: string
}

export function Input({ error, className, ...rest }: Props) {
  return (
    <FieldShell error={error}>
      {(errorId) => (
        <input
          {...rest}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(rest['aria-describedby'], errorId)}
          className={cn(field({ shape: 'line', error: Boolean(error) }), className)}
        />
      )}
    </FieldShell>
  )
}
