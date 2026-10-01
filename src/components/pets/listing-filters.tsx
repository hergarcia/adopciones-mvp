import { Button } from '@/components/ui/button'
import { Chip, ChipGroup } from '@/components/ui/chip'
import { ChevronDownIcon } from '@/components/ui/icons'
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
  /** El nombre de cada tira, para un lector de pantalla: las opciones se explican solas. */
  legends: Record<ListingFilter, string>
  /** La etiqueta de cada opción, por filtro y por su clave de dominio. */
  options: Record<ListingFilter, Record<string, string>>
  /** «Más filtros: sexo, tamaño, castrado», con cuántos marcados, de 0 a 6. */
  more: string[]
  apply: string
  clear: string
}

type Props = {
  filters: ListingFilters
  texts: FilterTexts
  /** Hidratado, «Sacar los filtros» es un botón que no suma un paso a «volver atrás». */
  hydrated: boolean
  /** Si «Más filtros» llega abierto: se decide al abrir la página y después lo maneja la persona. */
  openMore: boolean
  /** Sin animales, «Sacar los filtros» es la acción del vacío: acá no se repite (docs/10 §6). */
  offerClear: boolean
  /** Una casilla cambió: el controlador lee el formulario entero. */
  onChange: (form: HTMLFormElement) => void
  onClear: () => void
  className?: string
}

const FIRST: ListingFilter[] = ['species', 'age']
const MORE: ListingFilter[] = ['sex', 'size', 'neutered']

// Las tiritas para arrancar del cartel (plan §Listado): un formulario GET que anda sin ejecutar nada
// (FR-019). Especie, edad y departamento a la vista; sexo, tamaño y castrado en un `details` nativo,
// abierto si alguno llegó marcado. Debajo de 1024, especie y edad comparten una tira: son seis
// tiritas cortas, y en dos filas empujaban la pared a la mitad de la primera pantalla. Desde 1024,
// una columna al costado de la pared: «el poste» (research R12). Los departamentos van al final: son
// 19, y antes empujaban «Más filtros» —el tamaño, la búsqueda de quien vive en un apartamento— al
// fondo de la columna. Las casillas las marca `ListingController`, que escucha el `change` del
// formulario.
export function ListingFilters({
  filters,
  texts,
  hydrated,
  openMore,
  offerClear,
  onChange,
  onClear,
  className,
}: Props) {
  const marked = (filter: ListingFilter): readonly string[] => filters[filter]
  const moreCount = MORE.reduce((count, filter) => count + marked(filter).length, 0)

  const group = (filter: ListingFilter, stripClass?: string) => (
    <ChipGroup
      key={filter}
      label={texts.legends[filter]}
      orientation="vertical"
      className={stripClass}
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
  )

  return (
    <form
      method="get"
      action={LISTING_PATH}
      onChange={(event) => onChange(event.currentTarget)}
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible">
        {FIRST.map((filter) => group(filter, 'flex-auto shrink-0'))}
      </div>
      <details open={openMore || undefined} className="group/more">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
          {texts.more[moreCount]}
          <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-[var(--dur-base)] group-open/more:rotate-180" />
        </summary>
        <div className="mt-3 flex flex-col gap-3">{MORE.map((filter) => group(filter))}</div>
      </details>
      {group('department')}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Solo sin ejecutar nada: con el navegador que ejecuta se esconde desde el primer
            dibujo, sin esperar a hidratar y sin mover la pared. */}
        <Button type="submit" variant="secondary" className="[@media(scripting:enabled)]:hidden">
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
    </form>
  )
}
