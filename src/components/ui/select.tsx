'use client'

import * as Primitive from '@radix-ui/react-select'
import { cn } from '@/lib/cn'
import { CheckIcon, ChevronDownIcon } from './icons'

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

// 16 px mínimo y 44 px de alto como el resto de los controles. El borde toma el primario al foco;
// el error va debajo, en el acento (docs/10 §Componentes).
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
            'inline-flex min-h-11 items-center justify-between gap-2 rounded-control border bg-canvas px-3 text-base text-ink transition-colors duration-[var(--dur-fast)] ease-out focus:border-primary disabled:opacity-50',
            error ? 'border-accent' : 'border-line',
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
            className="z-10 overflow-hidden rounded-control border border-line bg-canvas shadow-float data-[state=open]:animate-[fade-in_var(--dur-fast)_var(--ease-out)]"
          >
            <Primitive.Viewport className="p-1">
              {options.map((option) => (
                <Primitive.Item
                  key={option.value}
                  value={option.value}
                  className="flex min-h-11 cursor-default items-center gap-2 rounded-control px-3 text-base text-ink data-highlighted:bg-primary-soft data-highlighted:outline-none"
                >
                  <Primitive.ItemIndicator className="text-primary">
                    <CheckIcon />
                  </Primitive.ItemIndicator>
                  <Primitive.ItemText>{option.label}</Primitive.ItemText>
                </Primitive.Item>
              ))}
            </Primitive.Viewport>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  )
}
