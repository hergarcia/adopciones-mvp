'use client'

import type { LaterDialogControl } from '@/components/forms/later-dialog'
import type { DeletionTarget } from '@/components/pets/delete-pet-dialog'
import { DeletionConfirmBody } from '@/components/pets/deletion-confirm-body'
import { useLitterDeletion } from '@/hooks/use-litter-deletion'

export function DeleteLitterBody({ id, returnPath, ...rest }: DeletionTarget & LaterDialogControl) {
  const remove = useLitterDeletion(id, returnPath)
  return <DeletionConfirmBody remove={remove} {...rest} />
}
