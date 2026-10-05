import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'

type Props = {
  /** Ya traducidos. `signIn` solo sin sesión: por si quien mira es el publicador. */
  texts: { title: string; body: string; toListing: string; signIn?: string }
  /** A dónde lleva «Entrar», con la vuelta a esta ficha. */
  signInHref?: string
  /**
   * La acción de la pantalla, cuando hay una que la deshace: «Desbloquear» para quien bloqueó a quien
   * lo publicó (historia #13). El camino al listado pasa entonces a `ghost`.
   */
  action?: React.ReactNode
}

// «No disponible por ahora» y «no está publicado» (FR-009): un mensaje fijo, sin nada del animal ni
// de quien lo publicó, y el camino al listado. No extiende `PetNotFound`, que es el «no existe» de
// la zona con sesión: le habla a la dueña y su salida es «Mis animales».
export function PetUnavailable({ texts, signInHref, action }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        <div className="flex flex-col items-center gap-3">
          {action}
          <LinkButton href={LISTING_PATH} variant={action ? 'ghost' : 'secondary'}>
            {texts.toListing}
          </LinkButton>
          {texts.signIn && signInHref ? (
            <LinkButton href={signInHref} variant="ghost">
              {texts.signIn}
            </LinkButton>
          ) : null}
        </div>
      }
    />
  )
}
