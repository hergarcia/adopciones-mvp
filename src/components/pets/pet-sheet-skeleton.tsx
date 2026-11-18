import { Skeleton } from '@/components/ui/skeleton'
import { PetWallSkeleton } from './pet-wall-skeleton'
import { SHEET_COLUMNS, SHEET_GALLERY, SHEET_READING, SHEET_STICKY_ACTION } from './sheet-layout'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

type Props = {
  /** `pet`: la tirita de «Quiero adoptar»; `litter`: «Las crías» debajo, sin tirita. */
  kind: 'pet' | 'litter'
}

// La ficha mientras llega, con su cartel: la foto 4:5 a sangre y el renglón de los puntos, el
// nombre, lo que se lee de un vistazo, los datos y la nota de quien publicó, cada uno del tamaño de
// lo que va a ocupar su lugar (historia #302). Nunca dice «no está publicado»: todavía no se sabe.
export function PetSheetSkeleton({ kind }: Props) {
  return (
    <div className="flex flex-col gap-10">
      <div className={SHEET_COLUMNS}>
        <div className={SHEET_GALLERY}>
          <Skeleton className={`${WALL_PHOTO_FRAME} w-full`} />
          <div className="h-11" />
        </div>
        <div className={SHEET_READING}>
          <div className="flex flex-col items-start gap-1">
            <Skeleton className="h-10 w-3/5" />
            <Skeleton className="mt-2 h-5 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-28 w-full" />
          {kind === 'pet' ? (
            <div className={SHEET_STICKY_ACTION}>
              <Skeleton className="h-14 w-full md:w-56" />
            </div>
          ) : null}
        </div>
      </div>
      {kind === 'litter' ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-7 w-32" />
          <PetWallSkeleton lines="card" />
        </div>
      ) : null}
    </div>
  )
}
