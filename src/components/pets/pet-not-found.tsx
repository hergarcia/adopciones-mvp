import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'

type Props = { texts: { title: string; body: string; action: string } }

// Un animal ajeno se ve exactamente igual que uno que no existe (FR-005), con su `h1` y el camino
// a «Mis animales». Armado como el vacío de «Mis animales»: el título a la izquierda, como en toda
// pantalla, y el cartel centrado en la hoja (docs/10 §Layout).
export function PetNotFound({ texts }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <EmptyState
        title={texts.body}
        className="mt-6"
        action={
          <LinkButton href={MY_PETS_PATH} variant="tirita" size="lg" className="md:w-auto">
            {texts.action}
          </LinkButton>
        }
      />
    </>
  )
}
