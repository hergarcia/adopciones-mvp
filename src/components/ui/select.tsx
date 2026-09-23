'use client'

import * as Primitive from '@radix-ui/react-select'
import { cn } from '@/lib/cn'
import { field } from './field'
import { FieldShell } from './field-shell'
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
  return (
    <FieldShell error={error}>
      {(errorId) => (
        <Primitive.Root
          value={value}
          // Radix manda un valor vacío cuando el valor llega antes que las opciones —al restaurar
          // un borrador—: su select oculto no lo encuentra y avisa un cambio a nada. Ninguna opción
          // es vacía, así que eso nunca es una elección de la persona.
          onValueChange={(next) => {
            if (next !== '') onValueChange?.(next)
          }}
          disabled={disabled}
        >
          <Primitive.Trigger
            id={id}
            aria-label={label}
            aria-labelledby={labelledBy}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              field({ shape: 'line', error: Boolean(error) }),
              'group inline-flex items-center justify-between gap-2 text-left data-placeholder:text-ink-muted',
              className,
            )}
          >
            <Primitive.Value placeholder={placeholder} />
            <Primitive.Icon className="transition-[translate,rotate] duration-[var(--dur-fast)] ease-out group-hover:translate-y-0.5 group-data-[state=open]:rotate-180">
              <ChevronDownIcon />
            </Primitive.Icon>
          </Primitive.Trigger>
          <Primitive.Portal>
            <Primitive.Content
              position="popper"
              sideOffset={4}
              className="z-30 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden border-2 border-ink bg-canvas shadow-float data-[state=open]:animate-[fade-in_var(--dur-fast)_var(--ease-out)]"
            >
              <Primitive.Viewport className="p-1">
                {options.map((option) => (
                  <Primitive.Item
                    key={option.value}
                    value={option.value}
                    className="flex min-h-11 cursor-default items-center gap-2 px-3 text-base text-ink data-highlighted:bg-ink data-highlighted:text-canvas data-highlighted:outline-none"
                  >
                    {/* El lugar del tilde existe en todas las opciones: si solo lo ocupara la
                        elegida, su texto quedaría corrido respecto de las demás. */}
                    <span className="inline-flex size-4 shrink-0 items-center justify-center">
                      <Primitive.ItemIndicator>
                        <CheckIcon />
                      </Primitive.ItemIndicator>
                    </span>
                    <Primitive.ItemText>{option.label}</Primitive.ItemText>
                  </Primitive.Item>
                ))}
              </Primitive.Viewport>
            </Primitive.Content>
          </Primitive.Portal>
        </Primitive.Root>
      )}
    </FieldShell>
  )
}
