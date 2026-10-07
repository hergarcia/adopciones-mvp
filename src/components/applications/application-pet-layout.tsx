import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'

type Props = {
  cover: PetPhotoData | null
  /** Ya traducido. */
  photoAlt: string
  head: React.ReactNode
  /** El trabajo a todo el ancho que queda y no en `--measure`: una pared y no una lectura. */
  wide?: boolean
  children: React.ReactNode
}

// Una pantalla de una solicitud alrededor del animal por el que se escribe: en el teléfono la foto
// pegada al lado del nombre, para que nadie olvide por quién está escribiendo; desde 1024, grande a
// la izquierda y el trabajo a la derecha, así la hoja se llena (docs/10 §Pantallas anchas). La usan
// el cuestionario, la puerta de identidad, Mi solicitud y el límite.
export function ApplicationPetLayout({ cover, photoAlt, head, wide = false, children }: Props) {
  return (
    <PetWorkLayout
      photo="small"
      head={head}
      picture={
        <ApplicationPetPhoto
          cover={cover}
          alt={photoAlt}
          sizes="(min-width: 1024px) 256px, 112px"
          eager
        />
      }
    >
      {wide ? children : <div className="max-w-[var(--measure)]">{children}</div>}
    </PetWorkLayout>
  )
}
