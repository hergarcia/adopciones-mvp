import { getTranslations } from 'next-intl/server'
import { PetUnavailable } from '@/components/pets/pet-unavailable'
import { signInWithNext } from '@/lib/auth/next-destination'
import { petPath } from '@/lib/pets/paths'

type Props = {
  code: string
  kind: 'missing' | 'paused' | 'expired' | 'unavailable'
  /** Solo en `unavailable`, sin sesión: por si quien mira es el publicador. */
  offerSignIn: boolean
}

// Lo que ve del enlace quien no es el publicador cuando no hay ficha (FR-009): un mensaje fijo por
// motivo, sin foto, nombre, zona ni nada de quien lo publicó, y el camino al listado.
export async function UnavailableScreen({ code, kind, offerSignIn }: Props) {
  const t = await getTranslations('pets.page')
  return (
    <PetUnavailable
      signInHref={signInWithNext(petPath(code))}
      texts={{
        title: t(`${kind}_title`),
        body: t(`${kind}_body`),
        toListing: t('to_listing'),
        signIn: offerSignIn ? t('sign_in_to_see') : undefined,
      }}
    />
  )
}
