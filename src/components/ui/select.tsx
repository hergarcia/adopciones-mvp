'use client'

import * as Primitive from '@radix-ui/react-select'
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { ErrorText } from './error-text'
import { field } from './field'
import { CheckIcon, ChevronDownIcon } from './icons'

export type SelectOption = {
  value: string
  /** Ya traducida: la primitiva no sabe de idiomas. */
  label: string
}

type Props = {
  options: SelectOption[]
  placeholder: string
  /** Para un `<label htmlFor>` visible. */
  id?: string
  /** Nombre accesible cuando no hay label visible; con uno, `id` o `aria-labelledby`. */
  label?: string
  'aria-labelledby'?: string
  value?: string
  onValueChange?: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

// El mismo renglón de papel que el Input, con su chevron; la lista es una nota que se despliega.
export function Select({
  options,
  placeholder,
  id,
  label,
  'aria-labelledby': labelledBy,
  value,
  onValueChange,
  error,
  disabled,
  className,
}: Props) {
  const generatedId = useId()
  const errorId = error ? `${generatedId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <Primitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <Primitive.Trigger
          id={id}
          aria-label={label}
          aria-labelledby={labelledBy}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            field({ shape: 'line', error: Boolean(error) }),
            'inline-flex items-center justify-between gap-2 data-placeholder:text-ink-muted',
            className,
          )}
        >
          <Primitive.Value placeholder={placeholder} />
          <Primitive.Icon>
            <ChevronDownIcon />
          </Primitive.Icon>
        </Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            position="popper"
            sideOffset={4}
            className="z-10 min-w-(--radix-select-trigger-width) overflow-hidden border-2 border-ink bg-canvas shadow-float data-[state=open]:animate-[fade-in_var(--dur-fast)_var(--ease-out)]"
          >
            <Primitive.Viewport className="p-1">
              {options.map((option) => (
                <Primitive.Item
                  key={option.value}
                  value={option.value}
                  className="flex min-h-11 cursor-default items-center gap-2 px-3 text-base text-ink data-highlighted:bg-ink data-highlighted:text-canvas data-highlighted:outline-none"
                >
                  <Primitive.ItemIndicator>
                    <CheckIcon />
                  </Primitive.ItemIndicator>
                  <Primitive.ItemText>{option.label}</Primitive.ItemText>
                </Primitive.Item>
              ))}
            </Primitive.Viewport>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
