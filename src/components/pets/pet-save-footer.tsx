import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import type { SaveProgress } from '@/hooks/use-pet-save'
import { PublishProgress } from './publish-progress'

type Props = {
  texts: {
    submit: string
    uploading: string
    sending: string
    changedElsewhere: string
    reopen: string
  }
  busy: boolean
  progress: SaveProgress | null
  /** Ya traducido: por qué el guardado no llegó. */
  error: string | null
  changedElsewhere: boolean
  onReopen: () => void
}

// Lo que no es de ningún campo va arriba de la tirita, que es también el reintento (FR-021). La
// tirita no va fija: taparía los campos del formulario más largo del producto.
export function PetSaveFooter({ texts, busy, progress, error, changedElsewhere, onReopen }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {error ? <ErrorText announce>{error}</ErrorText> : null}
      {changedElsewhere ? (
        <div className="flex flex-col items-start gap-1">
          <ErrorText announce>{texts.changedElsewhere}</ErrorText>
          <Button variant="ghost" size="sm" onClick={onReopen}>
            {texts.reopen}
          </Button>
        </div>
      ) : null}
      <Button type="submit" variant="tirita" size="lg" loading={busy}>
        {texts.submit}
      </Button>
      <PublishProgress progress={progress} uploading={texts.uploading} sending={texts.sending} />
    </div>
  )
}
