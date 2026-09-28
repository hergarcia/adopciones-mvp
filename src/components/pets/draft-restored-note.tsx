import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import type { DraftNotice } from '@/hooks/use-pet-draft'
import { MY_PETS_PATH } from '@/lib/pets/paths'

type Props = {
  notice: Exclude<DraftNotice, null>
  texts: { restored: string; startOver: string; alreadyPublished: string; seeMyPets: string }
  onStartOver: () => void
}

// Sin borde, sobre piedra: es secundaria, y lo primero de la pantalla siguen siendo las fotos.
export function DraftRestoredNote({ notice, texts, onStartOver }: Props) {
  return (
    <div className="flex flex-col items-start gap-1 bg-surface p-4 text-sm text-ink">
      <p>{notice === 'restored' ? texts.restored : texts.alreadyPublished}</p>
      {notice === 'restored' ? (
        <Button variant="ghost" size="sm" onClick={onStartOver}>
          {texts.startOver}
        </Button>
      ) : (
        <LinkButton href={MY_PETS_PATH} variant="ghost" size="sm">
          {texts.seeMyPets}
        </LinkButton>
      )}
    </div>
  )
}
