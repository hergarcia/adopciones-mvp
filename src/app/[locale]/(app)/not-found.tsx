import { SiteNotFound } from '@/app/[locale]/_components/site-not-found'

// Lo que no existe y lo que no es para quien lo pide se ven igual: la pantalla no confirma que la
// ruta exista ni para quién es (la cola de revisión, un pedido que ya se resolvió).
export default function AppNotFound() {
  return <SiteNotFound />
}
