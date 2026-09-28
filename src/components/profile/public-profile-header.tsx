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
// las iniciales; el nombre, la zona y si rescata.
export function PublicProfileHeader({ displayName, zone, isRescuer, photoUrl, texts }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      {photoUrl === null ? (
        <Avatar displayName={displayName} url={null} alt={texts.photoAlt} size="lg" />
      ) : (
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
      )}
      <h1 className="afiche mt-4 text-2xl text-ink">{displayName}</h1>
      <ZoneLabel zone={zone} />
      {isRescuer ? <RescuerTag label={texts.rescuer} /> : null}
    </div>
  )
}
