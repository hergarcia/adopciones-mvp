import { cn } from '@/lib/cn'
import { field } from './field'
import { FieldShell, describedBy } from './field-shell'

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  /** Mensaje de error, ya traducido. */
  error?: string
  className?: string
}

export function Textarea({ error, className, ...rest }: Props) {
  return (
    <FieldShell error={error}>
      {(errorId) => (
        <textarea
          {...rest}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(rest['aria-describedby'], errorId)}
          className={cn(field({ shape: 'box', error: Boolean(error) }), className)}
        />
      )}
    </FieldShell>
  )
}
