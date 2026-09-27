'use client'

import { ChoiceDialog } from '@/components/forms/choice-dialog'

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
    <ChoiceDialog
      open={open}
      title={title}
      closeLabel={texts.close}
      onDismiss={() => {
        if (!publishing) onClose()
      }}
      primary={{ label: texts.publishAnyway, onClick: onPublishAnyway, loading: publishing }}
      secondary={{ label: texts.backToMyPets, onClick: onBack, disabled: publishing }}
    >
      <p>{texts.body}</p>
      {hasPhotos ? <p className="mt-2 text-ink-muted">{texts.photosLost}</p> : null}
    </ChoiceDialog>
  )
}
