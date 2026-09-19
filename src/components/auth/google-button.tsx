import { startGoogleSignIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'

// Secundario a propósito: Google es un atajo, no el camino. La acción principal de la pantalla es
// la tirita del enlace por correo, y docs/10 admite una sola por pantalla.
export function GoogleButton({ label }: { label: string }) {
  return (
    <form action={startGoogleSignIn} className="mt-6">
      <Button type="submit" variant="secondary" size="lg" className="w-full">
        {label}
      </Button>
    </form>
  )
}
