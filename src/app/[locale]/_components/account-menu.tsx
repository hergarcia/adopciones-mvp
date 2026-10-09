import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'
import { badgeCount } from '@/lib/admin/badge'
import { adminPathFrom } from '@/lib/admin/paths'
import { INBOX_PATH, MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { LISTING_PATH, MY_PETS_PATH } from '@/lib/pets/paths'
import { adminPendingTotal, type AdminTotal } from '@/lib/supabase/queries/admin'
import { hasPublishedPets } from '@/lib/supabase/queries/pets'
import { lookupSession } from '@/lib/supabase/queries/session'
import { NavLink } from './nav-link'
import { Wordmark } from './wordmark'

// FR-015a: desde cualquier pantalla tiene que verse cómo entrar, o cómo llegar al propio perfil y
// a «Mis animales» (historia #53, FR-026); y «Animales en adopción», con sesión o sin ella (historia
// #57, FR-021).
// El caso que el requisito nombra —volver al día siguiente con la sesión viva y aterrizar en el
// sitio público sin ningún camino hacia las propias acciones— es justamente la portada, así que
// esto va también en el grupo público, aunque eso lo saque del render estático.
type Props = {
  /** «Opinar», que va en este renglón en todas las pantallas (historia #71, research R10). */
  feedback: React.ReactNode
}

export async function AccountMenu({ feedback }: Props) {
  const t = await getTranslations('auth.account_menu')
  // La sesión y no el perfil: alguien que entró y todavía no completó el perfil **está** adentro,
  // y ofrecerle «Entrar» sería mentirle sobre su propio estado (FR-015a).
  // Sin la puerta de la suspendida: el menú nunca redirige, porque el HTML puede estar ya saliendo
  // (research R4). La puerta la pone la página.
  const { user } = await lookupSession()
  const signedIn = user !== null
  // Solicitudes recibidas, solo a quien publicó: a quien solo adopta no le sirve, y le ponía al lado
  // de «Mis solicitudes» casi el mismo nombre para lo contrario.
  // Para quien administra, «Administrar» con lo que puede resolver (historia #73, FR-020): una sola
  // llamada, que para quien no administra corta en la base.
  const [receives, admin] = await Promise.all([
    user !== null && hasPublishedPets(user.id),
    user === null ? NOT_ADMIN : adminPendingTotal(),
  ])

  return (
    // La cabecera de la hoja: el borde de tinta la separa del contenido recién donde la hoja
    // existe como objeto (docs/10 §Pantallas anchas). El nombre del sitio a la izquierda y los
    // enlaces a la derecha. Con sesión no entran en el renglón de un teléfono: «Mi perfil» sube al
    // renglón del nombre y los otros van en el siguiente; con Solicitudes recibidas son cuatro y van
    // de a pares, que bajan juntos, así ningún enlace queda solo en un renglón (docs/10 AccountMenu,
    // decisiones 2026-10-07).
    <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink">
      <Wordmark />
      <div
        className={cn(
          'ml-auto flex flex-wrap justify-end gap-x-5 gap-y-2 sm:gap-x-6',
          signedIn && 'order-last basis-full',
          signedIn &&
            (receives || admin.isAdmin
              ? 'lg:order-none lg:basis-auto'
              : 'md:order-none md:basis-auto'),
        )}
      >
        {signedIn ? (
          <>
            <NavPair>
              <NavLink href={LISTING_PATH}>{t('listing')}</NavLink>
              <NavLink href={MY_PETS_PATH} prefetch={false}>
                {t('my_pets')}
              </NavLink>
            </NavPair>
            <NavPair>
              {receives ? (
                <NavLink href={INBOX_PATH} prefetch={false}>
                  {t('inbox')}
                </NavLink>
              ) : null}
              <NavLink href={MY_APPLICATIONS_PATH} prefetch={false}>
                {t('my_applications')}
              </NavLink>
            </NavPair>
            {admin.isAdmin ? (
              // «Opinar» baja del renglón del nombre y forma par con «Administrar»: así ningún
              // enlace queda solo en un renglón del teléfono (docs/10 AccountMenu, historia #73).
              <NavPair>
                {feedback}
                <NavLink href={adminPathFrom('menu')} prefetch={false}>
                  <AdminLabel count={admin.count} />
                </NavLink>
              </NavPair>
            ) : null}
          </>
        ) : (
          <>
            <NavLink href={LISTING_PATH}>{t('listing')}</NavLink>
            <NavLink href="/entrar">{t('sign_in')}</NavLink>
            {feedback}
          </>
        )}
      </div>
      {signedIn ? (
        // Opinar va con «Mi perfil» en el renglón del nombre: abajo, los pares quedan como estaban.
        <div className="flex items-center gap-x-5 sm:gap-x-6">
          {admin.isAdmin ? null : feedback}
          <NavLink href="/mi-perfil" prefetch={false}>
            {t('my_profile')}
          </NavLink>
        </div>
      ) : null}
    </nav>
  )
}

const NOT_ADMIN: AdminTotal = { isAdmin: false }

// «Administrar (5)» a la vista y «Administrar, 5 pendientes» para un lector de pantalla; sin número
// con 0 o si no se pudo contar.
async function AdminLabel({ count }: { count: number | null }) {
  const t = await getTranslations('admin.nav')
  const badge = count === null ? null : badgeCount(count)
  if (count === null || badge === null) return t('link')
  return (
    <>
      <span aria-hidden>{t('link_count', { count: badge })}</span>
      <span className="sr-only">{t('label', { count })}</span>
    </>
  )
}

// Dos enlaces que bajan juntos de renglón: con la misma separación que entre los demás.
function NavPair({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-x-5 gap-y-2 sm:gap-x-6">{children}</div>
}
