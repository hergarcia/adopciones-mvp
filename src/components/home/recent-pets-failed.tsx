import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'

type Props = { texts: { failed: string; failedAction: string } }

// Sin «Reintentar»: volver a abrir la portada ya lo es, y el listado tiene el suyo (research R3).
export function RecentPetsFailed({ texts }: Props) {
  return (
    <EmptyState
      title={texts.failed}
      action={
        <LinkButton href={LISTING_PATH} variant="secondary" prefetch={false}>
          {texts.failedAction}
        </LinkButton>
      }
    />
  )
}
