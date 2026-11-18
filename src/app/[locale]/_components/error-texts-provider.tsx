import { getTranslations } from 'next-intl/server'
import { ErrorTextsContext } from './error-texts'

// Las claves que usan los límites de error con sesión; las que usa uno nuevo se suman acá.
const KEYS = [
  'common.error_screen.title',
  'common.error_screen.body',
  'common.error_screen.retry',
  'common.toast.close',
  'common.toast.label',
  'common.toast.region',
  'profile.view.load_error',
  'profile.view.retry',
  'vouches.mine.load_error',
  'vouches.mine.retry',
  'verification.errors.load_error',
  'identity.errors.load_error',
  'review.errors.load_error',
  'pet_review.errors.load_error',
  'moderation.my_blocks.load_error',
  'moderation.my_blocks.retry',
  'moderation.reports.load_error',
  'moderation.suspended_list.load_error',
  'moderation.suspended_screen.load_error',
  'applications.errors.load_error',
  'applications.errors.form_load_error',
  'applications.errors.sent_load_error',
  'applications.errors.retry',
  'applications.held.sent.load_error',
  'inbox.errors.load_error',
  'inbox.errors.retry',
  'inbox.list.to_my_pets',
  'alerts.mine.load_error',
  'alerts.mine.retry',
  'adoptions.handover.load_error',
  'adoptions.handover.retry',
  'adoptions.handover.to_my_pets',
  'feedback.list.load_error',
  'surveys.summary.load_error',
  'admin.home.load_error',
  'admin.record.load_error',
  'pets.my_pets.load_error',
  'pets.my_pets.retry',
  'pets.my_pets.publish',
  'pets.form.load_error',
  'pets.form.edit_load_error',
  'pets.form.retry',
  'pets.notices.published',
  'pets.notices.edited',
  'pets.notices.deleted',
  'litters.page.load_error',
  'litters.page.to_my_pets',
] as const

// Los textos de los límites de error con sesión viajan al cliente por contexto y no por props (la
// zona pública usa `PublicErrorCopyProvider`). Un `error.tsx` es cliente por definición de Next y
// recibe solo `error` y `reset`, así que no hay camino para bajarle los textos desde el servidor:
// sin esto, la persona ve la pantalla cruda de Next en vez de la pantalla de error diseñada.
//
// Viajan solo estas claves, ya traducidas, y sin next-intl en el navegador: el layout de idioma
// deja su provider afuera para que `messages/es.json` no baje, y su runtime pesaba 13 KB en cada
// pantalla con sesión (constitución §VII, presupuesto de JS, historia #304).
export async function ErrorTextsProvider({ children }: { children: React.ReactNode }) {
  const t = await getTranslations()
  return (
    <ErrorTextsContext texts={Object.fromEntries(KEYS.map((key) => [key, t(key)]))}>
      {children}
    </ErrorTextsContext>
  )
}
