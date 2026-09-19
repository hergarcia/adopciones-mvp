import { AccountMenu } from '@/app/[locale]/_components/account-menu'
import { ErrorTextsProvider } from '@/app/[locale]/_components/error-texts-provider'

// La compuerta no vive acá sino en cada página, con `requireProfile`: un layout no sabe qué ruta
// se pidió, y mandar a todo el mundo al mismo destino pierde el de quien iba a editar.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountMenu />
      <ErrorTextsProvider>{children}</ErrorTextsProvider>
    </>
  )
}
