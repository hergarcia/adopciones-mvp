import { PetFormSkeleton } from '@/components/pets/pet-form-skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell width="full">
      <PetFormSkeleton photos={3} />
    </PageShell>
  )
}
