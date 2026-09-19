import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getMyProfile } from '@/lib/supabase/queries/profiles'

// FR-015a: desde cualquier pantalla tiene que verse cómo entrar, o cómo llegar al propio perfil.
// El caso que el requisito nombra —volver al día siguiente con la sesión viva y aterrizar en el
// sitio público sin ningún camino hacia las propias acciones— es justamente la portada, así que
// esto va también en el grupo público, aunque eso lo saque del render estático.
export async function AccountMenu() {
  const t = await getTranslations('auth.account_menu')
  const profile = await getMyProfile()

  return (
    <nav className="flex justify-end p-gutter md:p-gutter-wide">
      <Link
        href={profile === null ? '/entrar' : '/mi-perfil'}
        className="afiche text-base text-ink underline decoration-2 underline-offset-4 transition-[text-decoration-thickness] duration-[var(--dur-fast)] ease-out hover:decoration-4"
      >
        {profile === null ? t('sign_in') : t('my_profile')}
      </Link>
    </nav>
  )
}
