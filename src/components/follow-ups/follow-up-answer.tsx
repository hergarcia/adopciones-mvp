import { Stamp } from '@/components/ui/stamp'
import type { PetPhotoData } from '@/lib/pets/types'
import { FollowUpPhotos } from './follow-up-photos'

export type FollowUpAnswerTexts = {
  stamp: string
  /** «Lo contaste el 9 de noviembre.» o «Ana lo contó el …»; nulo si no se ve (tras un bloqueo). */
  date: string | null
  /** Ya con sus comillas; nulo sin texto. */
  text: string | null
  alts: string[]
}

type Props = { texts: FollowUpAnswerTexts; photos: PetPhotoData[] }

// La respuesta del seguimiento (plan §Mi solicitud): el sello en yerba porque es confianza, la fecha,
// las fotos pegadas y lo que contó. Para quien lo dio después de un bloqueo llega sin fecha, fotos ni
// texto, y queda solo el sello (FR-034).
export function FollowUpAnswer({ texts, photos }: Props) {
  return (
    <div className="flex animate-[fade-in_var(--dur-base)_var(--ease-out)] flex-col gap-4">
      <div>
        <Stamp tone="primary">{texts.stamp}</Stamp>
      </div>
      {texts.date === null ? null : <p className="text-sm text-ink-muted">{texts.date}</p>}
      {photos.length === 0 ? null : <FollowUpPhotos photos={photos} alts={texts.alts} />}
      {texts.text === null ? null : (
        <p className="max-w-[var(--measure)] text-base text-ink">{texts.text}</p>
      )}
    </div>
  )
}
