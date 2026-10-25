'use client'

import { useState } from 'react'
import { LitterForm } from '@/components/litters/litter-form'
import type { LitterFormTexts } from '@/components/litters/litter-form-types'
import { PetForm } from '@/components/pets/pet-form'
import type { PetFormTexts } from '@/components/pets/pet-form-types'
import type { PetPhotoSlot } from '@/hooks/use-pet-photos'
import { PUBLISH_LITTER_PATH, PUBLISH_PET_PATH } from '@/lib/litters/paths'
import type { LitterFormValues } from '@/lib/litters/types'
import type { PetFormValues } from '@/lib/pets/types'

type Seed = { values: PetFormValues; photos: PetPhotoSlot[] }

type Props = {
  titles: { litter: string; pet: string }
  litterTexts: LitterFormTexts
  petTexts: PetFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  litterInitial: LitterFormValues
  accountId: string
  today: string
}

// Publicar una camada, que puede terminar siendo un animal (research R9): «Publicarla como un
// animal» no navega, porque las fotos preparadas viven en esta página. Cambia al formulario de un
// animal con lo cargado y deja en la barra la dirección de ese formulario.
export function PublishFlow({
  titles,
  litterTexts,
  petTexts,
  departments,
  localitiesByDepartment,
  litterInitial,
  accountId,
  today,
}: Props) {
  const [seed, setSeed] = useState<Seed | null>(null)

  return (
    <>
      <h1 className="afiche text-2xl text-ink">{seed === null ? titles.litter : titles.pet}</h1>
      {seed === null ? (
        <LitterForm
          texts={litterTexts}
          departments={departments}
          localitiesByDepartment={localitiesByDepartment}
          initial={litterInitial}
          accountId={accountId}
          returnTo={PUBLISH_LITTER_PATH}
          today={today}
          onSingleYoung={(next) => {
            window.history.replaceState(null, '', PUBLISH_PET_PATH)
            setSeed(next)
          }}
        />
      ) : (
        <PetForm
          texts={petTexts}
          departments={departments}
          localitiesByDepartment={localitiesByDepartment}
          initial={seed.values}
          seedPhotos={seed.photos}
          accountId={accountId}
          returnTo={PUBLISH_PET_PATH}
        />
      )}
    </>
  )
}
