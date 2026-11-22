'use client'

import { useFormStatus } from 'react-dom'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { clearAccountDrafts } from '@/lib/drafts/account-drafts'

// La hoja cliente de «Cerrar sesión», para llevarse lo escrito sin guardar y trabajar desde el toque
// hasta que la acción contesta: con la señal mala tarda segundos (historia #346). El formulario
// sigue siendo del servidor: sin JavaScript cierra la sesión igual.
export function SignOutForm({ label }: { label: string }) {
  return (
    <form action={signOut} onSubmit={clearAccountDrafts}>
      <SignOutButton label={label} />
    </form>
  )
}

function SignOutButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" loading={pending}>
      {label}
    </Button>
  )
}
