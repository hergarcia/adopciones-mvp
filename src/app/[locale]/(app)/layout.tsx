import { redirect } from 'next/navigation'
import { AccountMenu } from '@/app/[locale]/_components/account-menu'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { getSessionUser } from '@/lib/supabase/queries/session'

// La compuerta de FR-013 y FR-016, en el layout del grupo y no en el proxy: el proxy corre en cada
// pedido y consultar la base ahí pondría una ida a la base delante de cada imagen y cada
// navegación.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if ((await getSessionUser()) === null) redirect('/entrar?next=/mi-perfil')
  if ((await getMyProfile()) === null) redirect('/completar-perfil')

  return (
    <>
      <AccountMenu />
      {children}
    </>
  )
}
