import { cn } from '@/lib/cn'
import { ErrorText } from './error-text'
import { field } from './field'

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  /** Mensaje de error, ya traducido. */
  error?: string
  className?: string
}

export function Textarea({ error, className, id, ...rest }: Props) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(field({ shape: 'box', error: Boolean(error) }), className)}
        {...rest}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
