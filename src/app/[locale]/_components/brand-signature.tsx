import { BrandMark } from '@/components/ui/brand-mark'
import { APP_NAME } from '@/lib/config'

// La firma del cartel: la pata y el nombre del sitio. Arriba la envuelve el enlace a la portada; al
// pie va sola, porque no es un camino a otra pantalla.
export function BrandSignature() {
  return (
    <span className="afiche firma text-xl text-ink">
      <BrandMark version="compacta" />
      {APP_NAME}
    </span>
  )
}
