import { getTranslations } from 'next-intl/server'
import { TextLink } from '@/components/ui/text-link'
import type { FeedbackEntry } from '@/lib/feedback/types'
import { calendarDayLabel } from '@/lib/moderation/day-label'
import { petPath } from '@/lib/pets/paths'
import { isPublicId, publicProfilePath } from '@/lib/profile/public-paths'

type Screens = Awaited<ReturnType<typeof getTranslations<'feedback.screens'>>>

// La pantalla desde la que llegó: de la ficha, el nombre del animal con su enlace si todavía existe;
// del perfil público, el enlace; de las demás, solo el nombre (research R9). Abrir la ficha cuenta
// una vista, así que no se trae por adelantado.
function screenOf(entry: FeedbackEntry, t: Screens): React.ReactNode {
  if (entry.screen === 'pet') {
    if (entry.petName === null || entry.subject === null) return t('pet_gone')
    return (
      <TextLink href={petPath(entry.subject)} placement="inline" prefetch={false}>
        {t('pet', { name: entry.petName })}
      </TextLink>
    )
  }
  if (entry.screen === 'profile' && entry.subject !== null && isPublicId(entry.subject)) {
    return (
      <TextLink href={publicProfilePath(entry.subject)} placement="inline" prefetch={false}>
        {t('profile')}
      </TextLink>
    )
  }
  return t(entry.screen)
}

// Cada opinión con su renglón del día y la pantalla: la página solo compone.
export async function feedbackEntries(items: FeedbackEntry[], locale: string) {
  const [t, screens] = await Promise.all([
    getTranslations('feedback.list'),
    getTranslations('feedback.screens'),
  ])
  return items.map((item) => ({
    id: item.id,
    body: item.body,
    meta: t.rich('meta', {
      date: calendarDayLabel(item.sentOn, locale),
      screen: () => screenOf(item, screens),
    }),
  }))
}
