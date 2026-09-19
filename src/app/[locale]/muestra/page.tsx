import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '../_components/page-shell'
import { ButtonBlock } from './_components/button-block'
import { CardBlock } from './_components/card-block'
import { ChipBlock } from './_components/chip-block'
import { DialogBlock } from './_components/dialog-block'
import { EmptyStateBlock } from './_components/empty-state-block'
import { InputBlock } from './_components/input-block'
import { ResourcesBlock } from './_components/resources-block'
import { SelectBlock } from './_components/select-block'
import { SheetBlock } from './_components/sheet-block'
import { SkeletonBlock } from './_components/skeleton-block'
import { TextareaBlock } from './_components/textarea-block'
import { ToastBlock } from './_components/toast-block'

type Props = {
  params: Promise<{ locale: string }>
}

// Con prerender, el `notFound()` de abajo se congela como una página 404 servida con estado
// **200**: un crawler o un test verían una ruta que existe. Dinámica, el estado es 404 de verdad.
export const dynamic = 'force-dynamic'

// Muestra de las primitivas, solo en desarrollo (FR-035): para que design-reviewer y Hernán tengan
// qué mirar antes de que haya una pantalla con datos reales.
export default async function Muestra({ params }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('common.showcase')

  return (
    <PageShell className="flex flex-col gap-6">
      <h1 className="afiche text-4xl text-ink">{t('title')}</h1>

      <ButtonBlock />
      <InputBlock />
      <TextareaBlock />
      <SelectBlock />
      <ChipBlock />
      <CardBlock />
      <SkeletonBlock />
      <EmptyStateBlock />
      <ResourcesBlock />
      <SheetBlock />
      <DialogBlock />
      <ToastBlock
        labels={{
          title: t('toast'),
          successOpen: t('toast_success_open'),
          errorOpen: t('toast_error_open'),
          success: t('toast_success'),
          error: t('toast_error'),
          close: t('toast_close'),
        }}
      />
    </PageShell>
  )
}
