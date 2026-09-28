import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { useRefocusAfterBusy } from '@/hooks/use-refocus-after-busy'

type Props = {
  busy: boolean
  /** La sesión se cerró al guardar: «Guardar» solo traería el mismo aviso (FR-008). */
  sessionClosed: boolean
  signInHref: string
  texts: { submit: string; signIn: string }
}

// La acción principal del formulario del perfil. Con la sesión cerrada pasa a ser «Entrar de nuevo»,
// el próximo paso real, y sale sin `LeavingDialog`: el aviso de arriba ya dijo qué pasa con lo
// escrito, y preguntarlo otra vez ofrecería quedarse en una pantalla que no puede guardar
// (docs/10 §Componentes).
export function ProfileFormTirita({ busy, sessionClosed, signInHref, texts }: Props) {
  const submitRef = useRefocusAfterBusy<HTMLButtonElement>(busy)

  if (sessionClosed) {
    return (
      <div data-announced-exit="">
        <LinkButton href={signInHref} variant="tirita" size="lg">
          {texts.signIn}
        </LinkButton>
      </div>
    )
  }

  return (
    <Button ref={submitRef} type="submit" variant="tirita" size="lg" loading={busy}>
      {texts.submit}
    </Button>
  )
}
