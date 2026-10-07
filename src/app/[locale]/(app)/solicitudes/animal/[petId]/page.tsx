import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ApplicationCard } from '@/components/applications/application-card'
import { ApplicationPetLayout } from '@/components/applications/application-pet-layout'
import { ShareButton } from '@/components/pets/share-button'
import { shareTexts } from '@/components/pets/share-texts'
import { EmptyState } from '@/components/ui/empty-state'
import { TextLink } from '@/components/ui/text-link'
import { petApplicationsOrder } from '@/lib/applications/inbox-order'
import { INBOX_PATH, petInboxPath, publisherApplicationPath } from '@/lib/applications/paths'
import type { PetApplicationRow } from '@/lib/applications/types'
import { requireProfile } from '@/lib/auth/require-profile'
import { petPath } from '@/lib/pets/paths'
import { visitInboxRecord } from '@/lib/supabase/queries/application-response-records'
import { getInboxPet, listPetApplications } from '@/lib/supabase/queries/application-responses'
import { applicationCardTexts } from '@/app/[locale]/_components/inbox-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string; petId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [t, pet] = await Promise.all([
    getTranslations('metadata.inbox'),
    getInboxPet((await params).petId).catch(() => null),
  ])
  return {
    title: pet === null ? t('list.title') : t('pet.title', { name: pet.name }),
    robots: { index: false, follow: false },
  }
}

const GROUPS = ['waiting', 'accepted', 'closed'] as const

async function cardsOf(rows: PetApplicationRow[], petName: string, now: Date) {
  return Promise.all(
    rows.map(async (row) => {
      const { view, texts } = await applicationCardTexts(row, petName, now)
      return (
        <ApplicationCard
          key={row.id}
          href={publisherApplicationPath(row.id)}
          avatar={row.applicant?.avatar ?? null}
          level={row.applicant?.level ?? 0}
          tone={view.tone}
          texts={texts}
        />
      )
    }),
  )
}

// Las solicitudes de un animal (FR-003): la carpeta de fichas, las que esperan respuesta primero y
// la que más espera arriba. Un animal ajeno, dado de baja o que no existe se ve igual: no existe
// (FR-001). Abrirla vuelve a habilitar el correo de la próxima nueva de este animal (R6).
export default async function PetInboxPage({ params }: Props) {
  const { locale, petId } = await params
  setRequestLocale(locale)
  const profile = await requireProfile(petInboxPath(petId))

  // Las tres preguntan a la base por el dueño: la ajena da nulo y cero filas, y la visita no escribe.
  const [pet, rows, t] = await Promise.all([
    getInboxPet(petId),
    listPetApplications(petId),
    getTranslations('inbox.pet'),
    visitInboxRecord(profile.id, petId).catch(() => undefined),
  ])
  if (pet === null) notFound()

  const groups = petApplicationsOrder(rows)
  const now = new Date()
  const cards = await Promise.all(GROUPS.map((group) => cardsOf(groups[group], pet.name, now)))

  return (
    <PageShell width="full">
      <ApplicationPetLayout
        cover={pet.cover}
        photoAlt={t('photo_alt', { name: pet.name })}
        wide
        head={
          <header className="flex flex-col items-start gap-2">
            <TextLink href={INBOX_PATH} prefetch={false}>
              {t('back')}
            </TextLink>
            <h1 className="afiche text-2xl break-words text-ink">
              {t('title', { name: pet.name })}
            </h1>
            <TextLink href={petPath(pet.code)}>{t('see_pet')}</TextLink>
          </header>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title={t('empty', { name: pet.name })}
            action={
              <ShareButton
                code={pet.code}
                from="my_pets"
                texts={await shareTexts(pet.name)}
                variant="secondary"
                region="own"
                toast={await toastLabels()}
              />
            }
          />
        ) : (
          <div className="flex max-w-[var(--measure)] flex-col gap-8">
            {GROUPS.map((group, index) =>
              cards[index].length === 0 ? null : (
                <section key={group} className="flex flex-col">
                  <h2 className="text-lg font-medium text-ink">{t(`groups.${group}`)}</h2>
                  <ul aria-label={t('list_label', { group: t(`groups.${group}`) })}>
                    {cards[index]}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}
      </ApplicationPetLayout>
    </PageShell>
  )
}

async function toastLabels() {
  const t = await getTranslations('common.toast')
  return { label: t('label'), region: t('region') }
}
