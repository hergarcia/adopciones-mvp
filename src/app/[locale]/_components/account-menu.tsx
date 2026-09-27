import { LinkButton } from '@/components/ui/link-button'
import { getTranslations } from 'next-intl/server'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { getSessionUser } from '@/lib/supabase/queries/session'

// FR-015a: desde cualquier pantalla tiene que verse cómo entrar, o cómo llegar al propio perfil y
// a «Mis animales» (historia #53, FR-026).
// El caso que el requisito nombra —volver al día siguiente con la sesión viva y aterrizar en el
// sitio público sin ningún camino hacia las propias acciones— es justamente la portada, así que
// esto va también en el grupo público, aunque eso lo saque del render estático.
export async function AccountMenu() {
  const t = await getTranslations('auth.account_menu')
  // La sesión y no el perfil: alguien que entró y todavía no completó el perfil **está** adentro,
  // y ofrecerle «Entrar» sería mentirle sobre su propio estado (FR-015a).
  const signedIn = (await getSessionUser()) !== null

  return (
    // La cabecera de la hoja: el borde de tinta la separa del contenido recién donde la hoja
    // existe como objeto (docs/10 §Pantallas anchas).
    <nav className="flex justify-end gap-6 p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink">
      {signedIn ? (
        <>
          <LinkButton href={MY_PETS_PATH} variant="ghost">
            {t('my_pets')}
          </LinkButton>
          <LinkButton href="/mi-perfil" variant="ghost">
            {t('my_profile')}
          </LinkButton>
        </>
      ) : (
        <LinkButton href="/entrar" variant="ghost">
          {t('sign_in')}
        </LinkButton>
      )}
    </nav>
  )
}
