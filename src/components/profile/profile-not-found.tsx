import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'

type Props = { texts: { title: string; body: string; action: string } }

// Un id inventado, una cuenta borrada y un perfil sin completar se ven exactamente igual (FR-007):
// la pantalla no dice cuál de los tres es.
export function ProfileNotFound({ texts }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        <LinkButton href="/" variant="tirita" size="lg" className="md:w-auto">
          {texts.action}
        </LinkButton>
      }
    />
  )
}
