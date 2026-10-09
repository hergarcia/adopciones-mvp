import { getTranslations } from 'next-intl/server'
import { TextLink } from '@/components/ui/text-link'
import { ADMIN_PATH } from '@/lib/admin/paths'

// «Volver a Administrar» arriba del título de cada lista de quien administra, en todos sus estados
// (historia #73, FR-023).
export async function AdminBackLink() {
  const t = await getTranslations('admin')
  return (
    <TextLink href={ADMIN_PATH} className="mb-4">
      {t('back')}
    </TextLink>
  )
}
