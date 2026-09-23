'use client'

import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { clearProfileDraft } from '@/hooks/use-profile-draft'

// La hoja cliente de «Cerrar sesión», solo para llevarse el borrador del perfil. El formulario
// sigue siendo del servidor: sin JavaScript cierra la sesión igual.
export function SignOutForm({ label }: { label: string }) {
  return (
    <form action={signOut} onSubmit={clearProfileDraft}>
      <Button type="submit" variant="ghost">
        {label}
      </Button>
    </form>
  )
}
