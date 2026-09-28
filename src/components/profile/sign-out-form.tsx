'use client'

import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { clearAccountDrafts } from '@/lib/drafts/account-drafts'

// La hoja cliente de «Cerrar sesión», solo para llevarse lo escrito sin guardar. El formulario
// sigue siendo del servidor: sin JavaScript cierra la sesión igual.
export function SignOutForm({ label }: { label: string }) {
  return (
    <form action={signOut} onSubmit={clearAccountDrafts}>
      <Button type="submit" variant="ghost">
        {label}
      </Button>
    </form>
  )
}
