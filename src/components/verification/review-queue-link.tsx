import { LinkButton } from '@/components/ui/link-button'

type Props = {
  /** Ya con la cantidad: «Administrar (3)». */
  label: string
  href: string
}

// El acceso a Administrar desde «Mi perfil», solo para quien administra. Va al pie de «Tu identidad»,
// separado por un divisor: pegado a «Verificar mi identidad» se leía como parte de esa acción
// (historia #202). En `ghost`: la tirita de la pantalla sigue siendo «Editar mi perfil».
export function ReviewQueueLink({ label, href }: Props) {
  return (
    <div className="mt-6 border-t-2 border-line pt-3">
      <LinkButton href={href} variant="ghost">
        {label}
      </LinkButton>
    </div>
  )
}
