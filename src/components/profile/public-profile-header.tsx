import type { ReactNode } from 'react'
import { ZoneLabel } from '@/components/zones/zone-label'
import type { PublicProfile } from '@/lib/vouches/types'
import { Avatar } from './avatar'
import { RescuerTag } from './rescuer-tag'

type Props = {
  profile: PublicProfile
  /** La ruta propia de la foto, o nulo sin foto (o cuando la pide una vista previa). */
  photoUrl: string | null
  /** Ya traducidos. */
  texts: { photoAlt: string; rescuer: string }
  /** Las adopciones con seguimiento; la página lo llena (`components/follow-ups`). */
  history?: ReactNode
}

// Quién es: la foto pegada con cinta, chica —en la persona la foto no manda, manda la chapita—, o
// las iniciales al lado del nombre, en `md`: repiten el nombre, y en `lg` pesaban más que la chapita.
// Después la zona y si rescata.
export function PublicProfileHeader({ profile, photoUrl, texts, history }: Props) {
  const { displayName } = profile
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
              className="block size-40 object-cover"
            />
          </div>
          <div className="mt-4">{name}</div>
        </>
      )}
      <ZoneLabel zone={profile} />
      {profile.isRescuer ? <RescuerTag label={texts.rescuer} /> : null}
      {history}
    </div>
  )
}
