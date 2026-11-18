'use client'

import type { LaterDialogControl } from '@/components/forms/later-dialog'
import { usePetDeletion } from '@/hooks/use-pet-deletion'
import type { DeletionTarget } from './delete-pet-dialog'
import { DeletionConfirmBody } from './deletion-confirm-body'

export function DeletePetBody({ id, returnPath, ...rest }: DeletionTarget & LaterDialogControl) {
  const remove = usePetDeletion(id, returnPath)
  return <DeletionConfirmBody remove={remove} {...rest} />
}
