import { LinkButton } from '@/components/ui/link-button'

type Props = {
  /** Ya con la cantidad: «Revisar pedidos de identidad (3)». */
  label: string
  href: string
}

// El acceso a la cola desde «Mi perfil», solo para quien administra. En `ghost`: la tirita de la
// pantalla sigue siendo «Editar mi perfil».
export function ReviewQueueLink({ label, href }: Props) {
  return (
    <LinkButton href={href} variant="ghost" className="mt-4">
      {label}
    </LinkButton>
  )
}
