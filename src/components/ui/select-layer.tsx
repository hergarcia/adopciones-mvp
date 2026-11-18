'use client'

import * as Primitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon } from './icons'
import type { SelectTriggerProps } from './select'

type Props = SelectTriggerProps & {
  /** Se tocó la cáscara antes de que esto llegara: la lista abre sola. */
  defaultOpen: boolean
  focusOnArrival: boolean
}

// La parte de Radix de `Select`: llega después de abrir, o al tocar la cáscara (`select.tsx`).
export function SelectLayer({
  options,
  placeholder,
  value,
  onValueChange,
  disabled,
  defaultOpen,
  focusOnArrival,
  triggerClassName,
  ...trigger
}: Props) {
  return (
    <Primitive.Root
      value={value}
      defaultOpen={defaultOpen}
      // Radix manda un valor vacío cuando el valor llega antes que las opciones —al restaurar
      // un borrador—: su select oculto no lo encuentra y avisa un cambio a nada. Ninguna opción
      // es vacía, así que eso nunca es una elección de la persona.
      onValueChange={(next) => {
        if (next !== '') onValueChange?.(next)
      }}
      disabled={disabled}
    >
      {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- solo si el foco ya estaba en la cáscara que esto reemplaza */}
      <Primitive.Trigger {...trigger} autoFocus={focusOnArrival} className={triggerClassName}>
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
  )
}
