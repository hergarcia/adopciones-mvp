import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'

type Props = { texts: { title: string; body: string; action: string } }

// Un animal ajeno se ve exactamente igual que uno que no existe (FR-005), con su `h1` y el camino
// a «Mis animales». Armado como todo `not-found` de la zona con sesión (docs/10, `HeadedEmptyState`).
export function PetNotFound({ texts }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        <LinkButton href={MY_PETS_PATH} variant="tirita" size="lg" className="md:w-auto">
          {texts.action}
        </LinkButton>
      }
    />
  )
}
