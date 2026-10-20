import type { Ref } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Chip, ChipGroup } from '@/components/ui/chip'
import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/lib/cn'
import {
  filterKey,
  filterOptions,
  hasFilters,
  valueOf,
  type ListingFilter,
  type ListingFilters,
} from '@/lib/pets/listing-query'
import { LISTING_PATH } from '@/lib/pets/paths'
import { ClearFiltersAction } from './clear-filters-action'

export type FilterTexts = {
  /** El nombre de cada grupo, a la vista a la izquierda de su tira. */
  legends: Record<ListingFilter, string>
  /** La etiqueta de cada opción, por filtro y por su clave de dominio. */
  options: Record<ListingFilter, Record<string, string>>
  /** «Solo castrados». */
  neuteredOnly: string
  /** «Todo el país», el departamento sin elegir. */
  anyDepartment: string
  apply: string
  clear: string
}

type Props = {
  filters: ListingFilters
  texts: FilterTexts
  /** Hidratado, «Sacar los filtros» es un botón que no suma un paso a «volver atrás». */
  hydrated: boolean
  /** Sin animales, «Sacar los filtros» es la acción del vacío: acá no se repite (docs/10 §6). */
  offerClear: boolean
  /** Una casilla cambió: el controlador lee el formulario entero. */
  onChange: (form: HTMLFormElement) => void
  onClear: () => void
  className?: string
  ref?: Ref<HTMLFormElement>
}

// El tamaño va segundo: es la búsqueda de quien vive en un apartamento.
const STRIPS: ListingFilter[] = ['species', 'size', 'age', 'sex']

// Las casillas las marca el estado del listado; el cambio lo escucha el formulario entero.
const ignore = () => {}

// Las tiritas para arrancar del cartel en una banda sobre la pared (issue #198): todos los filtros a
// la vista, cada grupo con su nombre. Es un formulario GET que anda sin ejecutar nada (FR-019). En el
// teléfono las cuatro tiras van en una fila que se desplaza y castrado y departamento debajo; desde
// 1024 todo fluye en renglones. Los 19 departamentos son una lista del navegador: como tiritas
// ocupaban más alto que la ventana. Las casillas las marca `ListingController`, que escucha el
// `change` del formulario.
export function ListingFilters({
  filters,
  texts,
  hydrated,
  offerClear,
  onChange,
  onClear,
  className,
  ref,
}: Props) {
  const marked = (filter: ListingFilter): readonly string[] => filters[filter]
  const department = filters.department[0]

  return (
    <form
      ref={ref}
      method="get"
      action={LISTING_PATH}
      onChange={(event) => onChange(event.currentTarget)}
      className={cn(
        'flex min-w-0 flex-col gap-3 border-b-2 border-line pb-6 lg:flex-row lg:flex-wrap lg:items-start lg:gap-x-12 lg:gap-y-5',
        className,
      )}
    >
      <div className="-mr-gutter flex gap-8 overflow-x-auto pr-gutter [scrollbar-width:none] md:-mr-gutter-wide md:pr-gutter-wide lg:contents">
        {STRIPS.map((filter) => (
          <ChipGroup
            key={filter}
            label={texts.legends[filter]}
            legend="beside"
            className="shrink-0"
          >
            {filterOptions(filter).map((option) => (
              <Chip
                key={option}
                label={texts.options[filter][option]}
                name={filterKey(filter)}
                value={valueOf(filter, option) ?? option}
                checked={marked(filter).includes(option)}
              />
            ))}
          </ChipGroup>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 lg:contents">
        <Checkbox
          label={texts.neuteredOnly}
          name={filterKey('neutered')}
          value={valueOf('neutered', 'yes')}
          checked={marked('neutered').length > 0}
          onChange={ignore}
          className="lg:mt-0.5"
        />
        <label className="flex min-w-0 basis-full items-center gap-3 sm:basis-auto lg:mt-0.5">
          <span className="shrink-0 text-sm font-bold text-ink">{texts.legends.department}</span>
          <NativeSelect
            name={filterKey('department')}
            value={department === undefined ? '' : valueOf('department', department)}
            onChange={ignore}
            options={[
              { value: '', label: texts.anyDepartment },
              ...filterOptions('department').map((code) => ({
                value: valueOf('department', code) ?? code,
                label: texts.options.department[code] ?? code,
              })),
            ]}
            className="min-w-0 flex-1 sm:w-48 sm:flex-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:ml-auto lg:min-h-12">
          {/* Solo sin ejecutar nada: con el navegador que ejecuta se esconde desde el primer
              dibujo, sin esperar a hidratar y sin mover la pared. Vuelve si el listado no llegó
              después de abrir (`data-later-failed`, historia #95). */}
          <Button
            type="submit"
            variant="secondary"
            className="[@media(scripting:enabled)]:[:root:not([data-later-failed])_&]:hidden"
          >
            {texts.apply}
          </Button>
          {offerClear && hasFilters(filters) ? (
            <ClearFiltersAction
              label={texts.clear}
              hydrated={hydrated}
              onClear={onClear}
              variant="ghost"
            />
          ) : null}
        </div>
      </div>
    </form>
  )
}
