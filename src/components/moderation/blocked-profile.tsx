import { HeadedEmptyState } from '@/components/ui/headed-empty-state'

type Props = {
  /** Ya traducidos: «Bloqueaste a Ana» y qué significa. */
  title: string
  body: string
  /** `UnblockButton`, que pone la página. */
  unblock: React.ReactNode
  /** Reportar y, para quien administra, suspender: `ProfileSafetyActions`. */
  actions: React.ReactNode
}

// El perfil de alguien que bloqueaste (plan §Perfil bloqueado): solo el nombre, qué significa y las
// acciones; sin foto, nivel ni nada más del perfil. Reemplaza al perfil entero, así que es una
// pantalla centrada como la del perfil que no existe, y no una columna perdida en la hoja.
export function BlockedProfile({ title, body, unblock, actions }: Props) {
  return (
    <section className="flex flex-col items-center gap-2">
      <HeadedEmptyState title={title} body={body} action={unblock} />
      <div className="flex flex-wrap justify-center gap-2">{actions}</div>
    </section>
  )
}
