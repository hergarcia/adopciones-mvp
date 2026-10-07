import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { TextLink } from '@/components/ui/text-link'

type Props = {
  /** Ya traducido: qué pasó y que lo escrito sigue ahí. */
  message: string
  attempt: number
  /** El camino que resuelve el freno: Mi solicitud, Mis solicitudes o los animales en adopción. */
  link: { href: string; label: string } | null
}

// Un envío que no se mandó, pegado arriba de la tirita, con el único camino que lo resuelve cuando
// no es reintentar (plan §Diseño, cuestionario).
export function SubmitFailed({ message, attempt, link }: Props) {
  return (
    <>
      <SaveFailedStrip message={message} attempt={attempt} />
      {link === null ? null : <TextLink href={link.href}>{link.label}</TextLink>}
    </>
  )
}
