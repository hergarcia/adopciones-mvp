'use client'

import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ya traducidos: el nombre del animal es el título. */
  texts: { title: string; trigger: string; close: string }
  children: React.ReactNode
}

// Las acciones de un animal en «Mis animales», en un `Sheet`: cinco botones no entran debajo de una
// card de 175 px (docs/10 §Layout, research R10). Se abre con «Más acciones».
export function PetStatusSheet({ open, onOpenChange, texts, children }: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="ghost" size="sm">
          {texts.trigger}
        </Button>
      }
    >
      {children}
    </Sheet>
  )
}
