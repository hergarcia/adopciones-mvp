import { Checkbox } from '@/components/ui/checkbox'
import { groupLabel } from '@/components/ui/chip'
import { cn } from '@/lib/cn'

type Props = {
  /** «Quien publica»: a la vista desde 1024 px, antes solo para el lector de pantalla. */
  legend: string
  label: string
  name: string
  value: string | undefined
  checked: boolean
}

const ignore = () => {}

// La casilla sola pesa lo mismo que «Solo castrados»: el verde de confianza ya está en cada tarjeta.
// En el teléfono va en su propio renglón, así no parte el de castrado y el departamento.
export function PublisherFilter({ legend, label, name, value, checked }: Props) {
  return (
    <fieldset className="flex min-w-0 basis-full items-center gap-3 lg:basis-auto">
      <legend className={cn('float-left', groupLabel, 'max-lg:sr-only')}>{legend}</legend>
      <Checkbox label={label} name={name} value={value} checked={checked} onChange={ignore} />
    </fieldset>
  )
}
