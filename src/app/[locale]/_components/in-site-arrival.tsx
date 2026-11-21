import { headers } from 'next/headers'
import { Suspense } from 'react'
import { isInSiteNavigation } from '@/lib/seo/in-site-navigation'

type Props = {
  /** La forma de la pantalla mientras llega. */
  fallback: React.ReactNode
  children: React.ReactNode
}

// La espera de una pantalla que también se abre desde afuera (historia #302). No es un `loading.tsx`:
// ese límite de `Suspense` va siempre, y al abrir la dirección la pantalla llegaría en un segundo
// envío, escondida hasta que corre JavaScript (FR-019 de #57) y sin el «no está publicado» del
// servidor. Acá el límite solo existe en el pedido de un toque dentro del sitio, que ya ejecuta.
// Recargar con `router.refresh()` una pantalla abierta desde afuera la vuelve a montar: solo lo hace
// la foto vencida después de una hora fuera (`StaleImagesRefresh`).
export async function InSiteArrival({ fallback, children }: Props) {
  const request = await headers()
  if (!isInSiteNavigation(request)) return children
  return <Suspense fallback={fallback}>{children}</Suspense>
}
