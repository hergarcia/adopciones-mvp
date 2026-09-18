import { cn } from '@/lib/cn'
import { ErrorText } from './input'

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  error?: string
  className?: string
}

// A diferencia del Input, lleva caja: es el recuadro de "contanos más" de un formulario de papel.
export function Textarea({ error, className, id, ...rest }: Props) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          'min-h-24 border-2 bg-canvas p-3 text-base text-ink placeholder:text-ink-muted disabled:opacity-50',
          error ? 'border-accent' : 'border-ink',
          className,
        )}
        {...rest}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
