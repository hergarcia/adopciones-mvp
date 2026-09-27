import { PetFormSkeleton } from '@/components/pets/pet-form-skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <PetFormSkeleton photos={0} />
    </PageShell>
  )
}
