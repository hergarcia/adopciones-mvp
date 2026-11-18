'use client'

import { useState } from 'react'
import { tapFailedTexts, useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'
import { cn } from '@/lib/cn'
import { BusyLabel } from './button'
import { field } from './field'
import { FieldShell } from './field-shell'
import { ChevronDownIcon } from './icons'
import { RetryNotice } from './retry-notice'

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

export type SelectTriggerProps = Pick<
  Props,
  'options' | 'placeholder' | 'id' | 'aria-labelledby' | 'value' | 'onValueChange' | 'disabled'
> & {
  'aria-label'?: string
  'aria-invalid'?: true
  'aria-describedby'?: string
  triggerClassName: string
}

const loadLayer = () => import('./select-layer')

// La lista es de Radix y llega después de abrir (`select-layer.tsx`): pesaba 16 KB en cada
// formulario con un departamento (historia #304). Hasta entonces, la cáscara es el mismo botón con
// el mismo texto; si se toca antes, trabaja mientras la lista baja y la abre apenas llega, o avisa
// debajo si no llega (historia #318).
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
  const [wantsOpen, setWantsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const layer = useAfterOpenOrTap(loadLayer)
  const ask = () => layer.wait(() => setWantsOpen(true))
  const chosen = options.find((option) => option.value === value)

  return (
    <FieldShell error={error}>
      {(errorId) => {
        const trigger = {
          id,
          'aria-label': label,
          'aria-labelledby': labelledBy,
          'aria-invalid': error ? (true as const) : undefined,
          'aria-describedby': errorId,
          triggerClassName: cn(
            field({ shape: 'line', error: Boolean(error) }),
            'group inline-flex items-center justify-between gap-2 text-left data-placeholder:text-ink-muted',
            className,
          ),
        }
        if (layer.value !== null) {
          return (
            <layer.value.SelectLayer
              {...trigger}
              options={options}
              placeholder={placeholder}
              value={value}
              onValueChange={onValueChange}
              disabled={disabled}
              defaultOpen={wantsOpen}
              focusOnArrival={isFocused}
            />
          )
        }
        const { triggerClassName, ...aria } = trigger
        return (
          <>
            <button
              type="button"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/role-has-required-aria-props -- se lee igual que el disparador de Radix que la reemplaza, un botón con rol combobox; su lista todavía no existe
              role="combobox"
              aria-expanded={false}
              aria-autocomplete="none"
              {...aria}
              disabled={disabled}
              aria-busy={layer.isWaiting || undefined}
              data-placeholder={chosen === undefined ? '' : undefined}
              onClick={ask}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={triggerClassName}
            >
              <span className="pointer-events-none">{chosen?.label ?? placeholder}</span>
              <span
                aria-hidden
                className="relative transition-[translate,rotate] duration-[var(--dur-fast)] ease-out group-hover:translate-y-0.5"
              >
                <BusyLabel loading={layer.isWaiting}>
                  <ChevronDownIcon />
                </BusyLabel>
              </span>
            </button>
            {layer.hasFailed ? <RetryNotice texts={tapFailedTexts()} onRetry={ask} /> : null}
          </>
        )
      }}
    </FieldShell>
  )
}
