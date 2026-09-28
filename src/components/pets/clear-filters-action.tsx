import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'

type Props = {
  label: string
  /** Hidratado es un botón, que no suma un paso a «volver atrás»; antes, un enlace al listado. */
  hydrated: boolean
  onClear: () => void
  variant: 'secondary' | 'ghost'
}

export function ClearFiltersAction({ label, hydrated, onClear, variant }: Props) {
  return hydrated ? (
    <Button variant={variant} onClick={onClear}>
      {label}
    </Button>
  ) : (
    <LinkButton href={LISTING_PATH} variant={variant}>
      {label}
    </LinkButton>
  )
}
