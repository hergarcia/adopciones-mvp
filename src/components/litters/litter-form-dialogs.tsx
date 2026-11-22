'use client'

import type { ComponentProps } from 'react'
import { PetFormDialogs } from '@/components/pets/pet-form-dialogs'
import { RemoveYoungDialog } from './remove-young-dialog'
import { SingleYoungDialog } from './single-young-dialog'

type Props = {
  pet: ComponentProps<typeof PetFormDialogs>
  removal: ComponentProps<typeof RemoveYoungDialog>
  single: ComponentProps<typeof SingleYoungDialog>
}

export function LitterFormDialogs({ pet, removal, single }: Props) {
  return (
    <>
      <PetFormDialogs {...pet} />
      <RemoveYoungDialog {...removal} />
      <SingleYoungDialog {...single} />
    </>
  )
}
