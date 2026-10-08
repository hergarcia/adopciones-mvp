import Link from 'next/link'
import { BrandMark } from '@/components/ui/brand-mark'
import { APP_NAME } from '@/lib/config'

// La firma a la izquierda de la cabecera: quien llega desde un enlace compartido tiene que saber
// dónde está antes de mirar el animal (docs/03 §Hipótesis). El nombre sigue siendo texto, así cambia
// con APP_NAME; la marca va al lado en la compacta, el dibujo de su alto (docs/10 §Marca). Sin
// subrayado, para no leerse como uno más de los enlaces de la sesión.
export function Wordmark() {
  return (
    <Link href="/" className="afiche inline-flex min-h-11 items-center text-xl text-ink">
      <span className="firma">
        <BrandMark version="compacta" />
        {APP_NAME}
      </span>
    </Link>
  )
}
