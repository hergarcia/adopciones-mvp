import { cn } from '@/lib/cn'
import { ErrorText } from './error-text'
import { field } from './field'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  /** Mensaje de error, ya traducido. Entra debajo del campo, en el acento. */
  error?: string
  className?: string
}

export function Input({ error, className, id, ...rest }: Props) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(field({ shape: 'line', error: Boolean(error) }), className)}
        {...rest}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
