import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationList } from '@/components/applications/application-list'
import { InboxPetCard } from '@/components/applications/inbox-pet-card'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { inboxOpenedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import { inboxOrder } from '@/lib/applications/inbox-order'
import { INBOX_PATH, petInboxPath } from '@/lib/applications/paths'
import { requireProfile } from '@/lib/auth/require-profile'
import { MY_PETS_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import { visitInboxRecord } from '@/lib/supabase/queries/application-response-records'
import { listPublisherInbox } from '@/lib/supabase/queries/application-responses'
import { listMyPets } from '@/lib/supabase/queries/pets'
import { inboxPetTexts } from '@/app/[locale]/_components/inbox-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.inbox.list')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Solicitudes (FR-002): el poste de la rescatista, sus animales con solicitudes, primero los que
// tienen nuevas. Abrirla vuelve a habilitar el correo de la próxima nueva de cada animal (R6).
export default async function InboxPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const profile = await requireProfile(INBOX_PATH)

  const [pets, t] = await Promise.all([listPublisherInbox(), getTranslations('inbox.list')])
  await Promise.all([
    visitInboxRecord(profile.id).catch(() => undefined),
    trackAll([inboxOpenedEvent()]),
  ])

  if (pets.length === 0) {
    const hasPets = (await listMyPets()).length > 0
    return (
      <PageShell width="full">
        <HeadedEmptyState
          title={t('title')}
          body={t('empty')}
          action={
            hasPets ? (
              <LinkButton href={MY_PETS_PATH} variant="secondary">
                {t('to_my_pets')}
              </LinkButton>
            ) : (
              <LinkButton href={PUBLISH_PATH} variant="secondary">
                {t('publish')}
              </LinkButton>
            )
          }
        />
      </PageShell>
    )
  }

  const ordered = inboxOrder(pets)
  const texts = await Promise.all(ordered.map((pet) => inboxPetTexts(pet)))

  return (
    <PageShell width="full" className="flex flex-col gap-8">
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <ApplicationList label={t('list_label')}>
        {ordered.map((pet, index) => (
          <InboxPetCard
            key={pet.petId}
            href={petInboxPath(pet.petId)}
            cover={pet.cover}
            index={index}
            texts={texts[index]}
          />
        ))}
      </ApplicationList>
    </PageShell>
  )
}
