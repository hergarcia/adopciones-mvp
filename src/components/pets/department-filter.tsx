'use client'

import { useId, useRef } from 'react'
import { NativeSelect } from '@/components/ui/native-select'
import { Select, type SelectOption } from '@/components/ui/select'
import { groupLabel } from '@/components/ui/chip'
import { cn } from '@/lib/cn'

type Props = {
  label: string
  name: string
  /** El valor en la dirección; vacío es «Todo el país». */
  value: string
  /** «Todo el país» primero, con valor vacío, y después los 19. */
  options: SelectOption[]
  hydrated: boolean
  /** Cambió el departamento: el controlador lee el formulario entero. */
  onChange: (form: HTMLFormElement) => void
}

// Radix no acepta una opción vacía: «Todo el país» lleva esta marca en la lista y vuelve a ser vacío
// en el formulario, donde el listado la ignoraría igual por no estar en el vocabulario.
const ANY = 'todo'

const ignore = () => {}

// El `select` oculto que Radix pone en todo formulario avisa un cambio cada vez que cambia el valor,
// también cuando lo cambia el listado (al sacar los filtros): el formulario no tiene que escucharlo.
const keepInside = (event: React.FormEvent) => event.stopPropagation()

// El `select` del navegador mientras la página no ejecuta nada, así el formulario GET anda igual
// (FR-019); hidratada, la lista es la de `Select`, la misma de todos los formularios.
export function DepartmentFilter({ label, name, value, options, hydrated, onChange }: Props) {
  const id = useId()
  const hidden = useRef<HTMLInputElement>(null)

  function pick(next: string) {
    const input = hidden.current
    if (input === null || input.form === null) return
    input.value = next === ANY ? '' : next
    onChange(input.form)
  }

  return (
    // En el teléfono el nombre queda para el lector de pantalla: «Todo el país» o el departamento
    // elegido ya dicen qué es, y así entra en el renglón de la casilla.
    <div className="flex min-w-40 flex-1 items-center gap-3 sm:flex-none">
      <label htmlFor={id} className={cn(groupLabel, 'max-sm:sr-only')}>
        {label}
      </label>
      {hydrated ? (
        <span onChange={keepInside} className="min-w-0 flex-1 sm:w-48 sm:flex-none">
          <input ref={hidden} type="hidden" name={name} value={value} />
          <Select
            id={id}
            value={value === '' ? ANY : value}
            onValueChange={pick}
            placeholder={options[0]?.label ?? ''}
            options={options.map((option) =>
              option.value === '' ? { ...option, value: ANY } : option,
            )}
            className="w-full"
          />
        </span>
      ) : (
        <NativeSelect
          id={id}
          name={name}
          value={value}
          onChange={ignore}
          options={options}
          className="min-w-0 flex-1 sm:w-48 sm:flex-none"
        />
      )}
    </div>
  )
}
