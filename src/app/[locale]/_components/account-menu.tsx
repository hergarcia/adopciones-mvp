import { getTranslations } from 'next-intl/server'
import { LISTING_PATH, MY_PETS_PATH } from '@/lib/pets/paths'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { NavLink } from './nav-link'
import { Wordmark } from './wordmark'

// FR-015a: desde cualquier pantalla tiene que verse cómo entrar, o cómo llegar al propio perfil y
// a «Mis animales» (historia #53, FR-026); y «Animales en adopción», con sesión o sin ella (historia
// #57, FR-021).
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
    // existe como objeto (docs/10 §Pantallas anchas). El nombre del sitio a la izquierda y los
    // enlaces a la derecha; si no entran en un renglón, los enlaces bajan al siguiente, todavía a
    // la derecha, antes que desbordar.
    <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink">
      <Wordmark />
      <div className="ml-auto flex flex-wrap justify-end gap-x-5 gap-y-2 sm:gap-x-6">
        <NavLink href={LISTING_PATH}>{t('listing')}</NavLink>
        {signedIn ? (
          <>
            <NavLink href={MY_PETS_PATH} prefetch={false}>
              {t('my_pets')}
            </NavLink>
            <NavLink href="/mi-perfil" prefetch={false}>
              {t('my_profile')}
            </NavLink>
          </>
        ) : (
          <NavLink href="/entrar">{t('sign_in')}</NavLink>
        )}
      </div>
    </nav>
  )
}
