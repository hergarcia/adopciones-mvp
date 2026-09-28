import Link from 'next/link'
import { APP_NAME } from '@/lib/config'

// El nombre del sitio en la voz de afiche, a la izquierda de la cabecera: quien llega desde un
// enlace compartido tiene que saber dónde está antes de mirar el animal (docs/03 §Hipótesis).
// Sin subrayado, para no leerse como uno más de los enlaces de la sesión.
export function Wordmark() {
  return (
    <Link href="/" className="afiche inline-flex min-h-11 items-center text-xl text-ink">
      {APP_NAME}
    </Link>
  )
}
