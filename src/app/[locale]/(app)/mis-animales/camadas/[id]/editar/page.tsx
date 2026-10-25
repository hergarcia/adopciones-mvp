import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LitterForm } from '@/components/litters/litter-form'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { requireVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { litterEditPath, litterPath } from '@/lib/litters/paths'
import { uruguayDay } from '@/lib/pets/age'
import { petGateRequest } from '@/lib/pets/paths'
import { publishedSlot } from '@/lib/pets/photo-source'
import { getLitterForEdit } from '@/lib/supabase/queries/litters'
import { litterFormTexts } from '@/app/[locale]/_components/litter-form-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  departmentOptions,
  localitiesByDepartment,
} from '@/app/[locale]/_components/profile-form-texts'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('litters.form')
  return { title: t('edit_meta_title'), robots: { index: false, follow: false } }
}

// Editar la camada es publicar: la misma puerta de nivel 1, con la vuelta a esta edición (FR-002).
// Una ajena o que no existe es el mismo «Esta camada no existe»; una dada de baja no se edita, y su
// ficha le dice a la dueña por qué.
export default async function EditLitterPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const path = litterEditPath(id)
  const profile = await requireVerifiedPhone(petGateRequest(path))
  const [litter, texts, t] = await Promise.all([
    getLitterForEdit(id),
    litterFormTexts('edit'),
    getTranslations('litters.form'),
  ])
  if (litter === null) notFound()
  if (litter.isTakenDown) redirect(litterPath(litter.code))

  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{t('edit_title', { name: litter.name })}</h1>
      <LitterForm
        texts={texts}
        departments={departmentOptions()}
        localitiesByDepartment={localitiesByDepartment()}
        initial={litter.values}
        accountId={profile.id}
        returnTo={path}
        today={uruguayDay(new Date())}
        editing={{
          litterId: litter.id,
          youngIds: litter.values.young.flatMap((one) => (one.id === undefined ? [] : [one.id])),
          ageBase: litter.ageBase,
          ageShown: litter.age,
          deliversFrom: litter.deliversFrom,
          photos: {
            litter: litter.photos.litter.map(publishedSlot),
            young: Object.fromEntries(
              Object.entries(litter.photos.young).map(([key, photos]) => [
                key,
                photos.map(publishedSlot),
              ]),
            ),
          },
        }}
      />
    </PageShell>
  )
}
