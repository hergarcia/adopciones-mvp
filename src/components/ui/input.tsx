import { cn } from '@/lib/cn'
import { field } from './field'
import { FieldShell, describedBy } from './field-shell'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'aria-invalid'> & {
  /** Mensaje de error, ya traducido. */
  error?: string
  /**
   * Inválido con el error dibujado afuera: un campo que es parte de una fila con un solo error
   * para todas sus partes. El vínculo con ese error lo pone quien lo usa, con `aria-describedby`.
   */
  invalid?: boolean
  textSize?: 'base' | '2xl'
  className?: string
}

export function Input({ error, invalid = false, textSize, className, ...rest }: Props) {
  const isInvalid = invalid || Boolean(error)

  return (
    <FieldShell error={error}>
      {(errorId) => (
        <input
          {...rest}
          aria-invalid={isInvalid ? true : undefined}
          aria-describedby={describedBy(rest['aria-describedby'], errorId)}
          className={cn(field({ shape: 'line', error: isInvalid, textSize }), className)}
        />
      )}
    </FieldShell>
  )
}
