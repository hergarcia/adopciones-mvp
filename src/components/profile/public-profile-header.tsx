import { ZoneLabel } from '@/components/zones/zone-label'
import type { DepartmentCode } from '@/lib/zones/departments'
import { Avatar } from './avatar'
import { RescuerTag } from './rescuer-tag'

type Props = {
  displayName: string
  zone: { department: DepartmentCode; locality: string }
  isRescuer: boolean
  /** La ruta propia de la foto, o nulo sin foto (o cuando la pide una vista previa). */
  photoUrl: string | null
  /** Ya traducidos. */
  texts: { photoAlt: string; rescuer: string }
}

// Quién es: la foto pegada con cinta, chica —en la persona la foto no manda, manda la chapita—, o
// las iniciales al lado del nombre, en `md`: repiten el nombre, y en `lg` pesaban más que la chapita.
// Después la zona y si rescata.
export function PublicProfileHeader({ displayName, zone, isRescuer, photoUrl, texts }: Props) {
  const name = <h1 className="afiche text-2xl text-ink">{displayName}</h1>
  return (
    <div className="flex flex-col items-start gap-2">
      {photoUrl === null ? (
        <div className="flex items-center gap-4">
          <Avatar displayName={displayName} url={null} alt={texts.photoAlt} />
          {name}
        </div>
      ) : (
        <>
          <div className="cinta mt-3 rotate-[var(--tilt)]">
            {/* La ruta propia ya cachea cinco minutos; el optimizador de Next la guardaría más. */}
            {/* eslint-disable-next-line next/no-img-element */}
            <img
              src={photoUrl}
              alt={texts.photoAlt}
              width={160}
              height={160}
              className="block size-40 border-2 border-ink object-cover"
            />
          </div>
          <div className="mt-4">{name}</div>
        </>
      )}
      <ZoneLabel zone={zone} />
      {isRescuer ? <RescuerTag label={texts.rescuer} /> : null}
    </div>
  )
}
