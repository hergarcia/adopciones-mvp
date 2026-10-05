import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PetReviewDecision } from '@/components/pets/pet-review-decision'
import { PetReviewItem } from '@/components/pets/pet-review-item'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { WorkQueue } from '@/components/forms/work-queue'
import { petReviewDecisionTexts } from '@/components/pets/pet-review-texts'
import { publisherTexts } from '@/components/pets/pet-sheet-texts'
import { OwnerCard } from '@/components/verification/owner-card'
import { requireProfile } from '@/lib/auth/require-profile'
import { PET_REVIEW_PATH } from '@/lib/pets/paths'
import { listPetReviewQueue } from '@/lib/supabase/queries/pet-reviews'
import { isAdmin } from '@/lib/supabase/queries/review'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { StaleImagesRefresh } from '@/app/[locale]/_components/stale-images-refresh'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pet_review.metadata')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// La lista de quien administra (historia #59, US4). Quien no administra ve lo mismo que en una ruta
// que no existe (FR-023); la base lo vuelve a preguntar al leer y al resolver.
export default async function PetReviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  await requireProfile(PET_REVIEW_PATH)
  if (!(await isAdmin())) notFound()

  const now = new Date()
  const [t, toast, queue] = await Promise.all([
    getTranslations('pet_review'),
    getTranslations('common.toast'),
    listPetReviewQueue(now),
  ])
  const items = await Promise.all(
    queue.items.map(async (pet, index) => {
      const [owner, decision] = await Promise.all([
        publisherTexts(pet.publisher),
        pet.isOwn ? null : petReviewDecisionTexts(pet),
      ])
      return {
        key: pet.id,
        node: (
          <PetReviewItem
            pet={pet}
            now={now}
            lead={index === 0}
            owner={<OwnerCard publisher={pet.publisher} texts={owner} />}
            decision={
              decision === null ? null : (
                <PetReviewDecision petId={pet.id} knownSince={pet.pendingSince} texts={decision} />
              )
            }
          />
        ),
      }
    }),
  )

  return (
    <PageShell width="full">
      <StaleImagesRefresh signedAt={queue.signedAt} />
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <p className="mt-2 mb-6 text-sm text-ink-muted">{t('count', { count: queue.waiting })}</p>
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        <WorkQueue
          items={items}
          texts={{ label: t('list_label'), empty: t('empty'), back: t('back_profile') }}
          backHref="/mi-perfil"
        />
      </AnnounceNotices>
    </PageShell>
  )
}
