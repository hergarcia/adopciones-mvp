import { AccountMenu } from '@/app/[locale]/_components/account-menu'
import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'

// Las compuertas de este grupo no son una sola: cada pantalla decide la suya, porque `/entrar` y
// `/completar-perfil` piden cosas opuestas. Están en cada página, no acá, para que el layout no
// tenga que adivinar en cuál está.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountMenu />
      <ErrorTextsProvider>{children}</ErrorTextsProvider>
    </>
  )
}
