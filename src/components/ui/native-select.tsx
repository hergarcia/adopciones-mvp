import { cn } from '@/lib/cn'
import { field } from './field'
import { ChevronDownIcon } from './icons'
import type { SelectOption } from './select'

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'> & {
  options: SelectOption[]
  className?: string
}

// El renglón de `Select` sobre el `select` del navegador: va en un formulario GET que tiene que
// andar sin ejecutar nada, y su lista es la del sistema, que en el teléfono ya es una hoja que sube.
export function NativeSelect({ options, className, ...rest }: Props) {
  return (
    <span className={cn('group relative flex', className)}>
      <select
        {...rest}
        className={cn(field({ shape: 'line' }), 'w-full cursor-pointer appearance-none pr-6')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-ink transition-transform duration-[var(--dur-fast)] ease-out group-hover:translate-y-[calc(-50%+2px)]" />
    </span>
  )
}
