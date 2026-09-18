'use client'

import * as Primitive from '@radix-ui/react-select'
import { cn } from '@/lib/cn'
import { CheckIcon, ChevronDownIcon } from './icons'
import { ErrorText, fieldLine } from './input'

export type SelectOption = {
  value: string
  /** Ya traducida: la primitiva no sabe de idiomas. */
  label: string
}

type Props = {
  options: SelectOption[]
  placeholder: string
  label: string
  value?: string
  onValueChange?: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

// El mismo renglón de papel que el Input, con su chevron; la lista es una nota que se despliega.
// 16 px mínimo y 44 px de alto. El error va debajo, en el acento (docs/10 §Componentes).
export function Select({
  options,
  placeholder,
  label,
  value,
  onValueChange,
  error,
  disabled,
  className,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <Primitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <Primitive.Trigger
          aria-label={label}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldLine,
            'inline-flex min-h-11 items-center justify-between gap-2 px-0 data-placeholder:text-ink-muted',
            error ? 'border-accent focus:shadow-[0_2px_0_0_var(--color-accent)]' : 'border-ink',
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
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  )
}
