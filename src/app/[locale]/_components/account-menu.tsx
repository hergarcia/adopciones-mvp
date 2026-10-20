import { getTranslations } from 'next-intl/server'
import { LinkButton } from '@/components/ui/link-button'
import { badgeCount } from '@/lib/admin/badge'
import { adminPathFrom } from '@/lib/admin/paths'
import { INBOX_PATH, MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { cn } from '@/lib/cn'
import { FEEDBACK_PATH } from '@/lib/feedback/screens'
import { LISTING_PATH, MY_PETS_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import { adminPendingTotal, type AdminTotal } from '@/lib/supabase/queries/admin'
import { hasPublishedPets } from '@/lib/supabase/queries/pets'
import { lookupSession } from '@/lib/supabase/queries/session'
import { AccountPopover } from './account-popover'
import { NavLink } from './nav-link'
import { Wordmark } from './wordmark'

// FR-015a: desde cualquier pantalla tiene que verse cómo entrar, o cómo llegar al propio perfil y
// a «Mis animales» (historia #53, FR-026); y «Animales en adopción», con sesión o sin ella (historia
// #57, FR-021).
// El caso que el requisito nombra —volver al día siguiente con la sesión viva y aterrizar en el
// sitio público sin ningún camino hacia las propias acciones— es justamente la portada, así que
// esto va también en el grupo público, aunque eso lo saque del render estático.
type Props = {
  /** «Opinar», que va en la cabecera en todas las pantallas (historia #71, research R10). */
  feedbackLabel: string
}

const BAR =
  'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:gap-x-6 p-gutter md:p-gutter-wide lg:border-b-2 lg:border-ink'

// Un renglón del menú: a lo ancho y en el tamaño del texto de lectura, no en el de la barra.
const ROW = 'flex w-full justify-start text-base'

// La cabecera de la hoja (issue #198): cada cosa con su peso. Lo público al lado del nombre del
// sitio; a la derecha la única acción destacada, «Publicar un animal», y lo de la cuenta en un menú,
// agrupado por para qué sirve. Antes eran siete enlaces iguales uno al lado del otro.
export async function AccountMenu({ feedbackLabel }: Props) {
  const t = await getTranslations('auth.account_menu')
  // La sesión y no el perfil: alguien que entró y todavía no completó el perfil **está** adentro,
  // y ofrecerle «Entrar» sería mentirle sobre su propio estado (FR-015a).
  // Sin la puerta de la suspendida: el menú nunca redirige, porque el HTML puede estar ya saliendo
  // (research R4). La puerta la pone la página.
  const { user } = await lookupSession()
  // Solicitudes recibidas, solo a quien publicó: a quien solo adopta no le sirve, y le ponía al lado
  // de «Mis solicitudes» casi el mismo nombre para lo contrario.
  // Para quien administra, «Administrar» con lo que puede resolver (historia #73, FR-020): una sola
  // llamada, que para quien no administra corta en la base.
  const [receives, admin] = await Promise.all([
    user !== null && hasPublishedPets(user.id),
    user === null ? NOT_ADMIN : adminPendingTotal(),
  ])
  const feedback = (className?: string) => (
    <NavLink href={FEEDBACK_PATH} prefetch={false} className={className}>
      {feedbackLabel}
    </NavLink>
  )

  if (user === null) {
    return (
      <nav className={BAR}>
        <Wordmark />
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-5 gap-y-2 sm:gap-x-6">
          <NavLink href={LISTING_PATH}>{t('listing')}</NavLink>
          {feedback()}
          <LinkButton href="/entrar" variant="secondary" size="sm">
            {t('sign_in')}
          </LinkButton>
        </div>
      </nav>
    )
  }

  // Lo pendiente de quien administra también en el botón: con «Administrar» adentro del menú, si no,
  // dejaría de verse sin abrirlo.
  const pending = admin.isAdmin ? admin.count : null
  const badge = pending === null ? null : badgeCount(pending)
  return (
    <nav className={BAR}>
      <div className="flex items-center gap-x-10">
        <Wordmark />
        <span className="hidden lg:contents">
          <NavLink href={LISTING_PATH}>{t('listing')}</NavLink>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-x-3 sm:gap-x-6">
        <LinkButton href={PUBLISH_PATH} variant="primary" size="sm" prefetch={false}>
          <span className="sm:hidden">{t('publish_short')}</span>
          <span className="hidden sm:inline">{t('publish')}</span>
        </LinkButton>
        <AccountPopover
          title={t('account')}
          close={t('close')}
          trigger={
            pending === null || badge === null ? (
              t('account')
            ) : (
              <>
                <span aria-hidden>{t('account_count', { count: badge })}</span>
                <span className="sr-only">{t('account_label', { count: pending })}</span>
              </>
            )
          }
        >
          {/* En el teléfono «Animales en adopción» no entra en la barra: va primero en el menú. */}
          <MenuGroup className="lg:hidden">
            <NavLink href={LISTING_PATH} className={ROW}>
              {t('listing')}
            </NavLink>
          </MenuGroup>
          <MenuGroup>
            <NavLink href={MY_PETS_PATH} prefetch={false} className={ROW}>
              {t('my_pets')}
            </NavLink>
            {receives ? (
              <NavLink href={INBOX_PATH} prefetch={false} className={ROW}>
                {t('inbox')}
              </NavLink>
            ) : null}
            <NavLink href={MY_APPLICATIONS_PATH} prefetch={false} className={ROW}>
              {t('my_applications')}
            </NavLink>
          </MenuGroup>
          <MenuGroup>
            <NavLink href="/mi-perfil" prefetch={false} className={ROW}>
              {t('my_profile')}
            </NavLink>
            {admin.isAdmin ? (
              <NavLink href={adminPathFrom('menu')} prefetch={false} className={ROW}>
                <AdminLabel count={admin.count} />
              </NavLink>
            ) : null}
          </MenuGroup>
          <MenuGroup>{feedback(ROW)}</MenuGroup>
        </AccountPopover>
      </div>
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

// Un grupo del menú por para qué sirve, separado del siguiente por el divisor de papel.
function MenuGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col border-b-2 border-line py-1 last:border-b-0', className)}>
      {children}
    </div>
  )
}
