import type { ComponentProps } from 'react'
import { PetForm } from '@/components/pets/pet-form'
import { PageShell } from './page-shell'
import { petFormTexts } from './pet-form-texts'
import { departmentOptions, localitiesByDepartment } from './profile-form-texts'

type Props = Pick<
  ComponentProps<typeof PetForm>,
  'initial' | 'accountId' | 'returnTo' | 'editing'
> & { title: string; mode: 'publish' | 'edit' }

// Publicar y editar son la misma pantalla: la hoja ancha, el título y el formulario con las zonas.
export async function PetFormScreen({ title, mode, ...form }: Props) {
  const texts = await petFormTexts(mode)
  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{title}</h1>
      <PetForm
        texts={texts}
        departments={departmentOptions()}
        localitiesByDepartment={localitiesByDepartment()}
        {...form}
      />
    </PageShell>
  )
}
