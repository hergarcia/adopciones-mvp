'use client'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

type Props = {
  open: boolean
  /** Ya armado: «Ya tenés una perra llamada Luna». */
  title: string
  texts: {
    body: string
    photosLost: string
    publishAnyway: string
    backToMyPets: string
    close: string
  }
  hasPhotos: boolean
  publishing: boolean
  onPublishAnyway: () => void
  onBack: () => void
  onClose: () => void
}

// El aviso no frena: publicar igual publica (FR-017). Elegir volver es la confirmación de que las
// fotos se pierden, así que no se abre un segundo aviso; cerrar deja el formulario como estaba.
export function DuplicateNameDialog({
  open,
  title,
  texts,
  hasPhotos,
  publishing,
  onPublishAnyway,
  onBack,
  onClose,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !publishing) onClose()
      }}
      title={title}
      closeLabel={texts.close}
    >
      <p className="text-base text-ink">{texts.body}</p>
      {hasPhotos ? <p className="mt-2 text-base text-ink-muted">{texts.photosLost}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" loading={publishing} onClick={onPublishAnyway}>
          {texts.publishAnyway}
        </Button>
        <Button variant="secondary" disabled={publishing} onClick={onBack}>
          {texts.backToMyPets}
        </Button>
      </div>
    </Dialog>
  )
}
