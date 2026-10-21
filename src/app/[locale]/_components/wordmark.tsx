import Link from 'next/link'
import { BrandSignature } from './brand-signature'

// La firma a la izquierda de la cabecera: quien llega desde un enlace compartido tiene que saber
// dónde está antes de mirar el animal (docs/03 §Hipótesis). Sin subrayado, para no leerse como uno
// más de los enlaces de la sesión.
export function Wordmark() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center">
      <BrandSignature />
    </Link>
  )
}
