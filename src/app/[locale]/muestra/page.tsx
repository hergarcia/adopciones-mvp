import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ButtonBlock } from './_components/button-block'
import { CardBlock } from './_components/card-block'
import { ChipBlock } from './_components/chip-block'
import { EmptyStateBlock } from './_components/empty-state-block'
import { InputBlock } from './_components/input-block'
import { OverlayTriggers } from './_components/overlay-triggers'
import { SelectBlock } from './_components/select-block'
import { SkeletonBlock } from './_components/skeleton-block'
import { TextareaBlock } from './_components/textarea-block'

type Props = {
  params: Promise<{ locale: string }>
}

// Render por pedido, no estático. Con prerender, el `notFound()` de abajo se congela como una
// página 404 servida con estado **200**, que no es "responde no encontrada": un crawler o un test
// verían una ruta que existe. Dinámica, el estado es 404 de verdad.
export const dynamic = 'force-dynamic'

// Muestra de las primitivas, solo en desarrollo: en el build de producción responde "no
// encontrada" (FR-035). Existe para que design-reviewer y Hernán tengan qué mirar antes de que
// haya una pantalla con datos reales.
//
// Compone bloques con nombre y no tiene detalle visual propio: una página con más de ~50 líneas de
// JSX tiene componentes escondidos (docs/08).
export default async function Muestra({ params }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('common.showcase')

  return (
    <main className="flex max-w-[var(--measure)] flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{t('title')}</h1>

      <ButtonBlock />
      <InputBlock />
      <TextareaBlock />
      <SelectBlock />
      <ChipBlock />
      <CardBlock />
      <SkeletonBlock />
      <EmptyStateBlock />

      <OverlayTriggers
        labels={{
          sheet: t('sheet'),
          sheetBottom: t('sheet_bottom'),
          sheetSide: t('sheet_side'),
          sheetTitle: t('sheet_title'),
          sheetClose: t('sheet_close'),
          dialog: t('dialog'),
          dialogOpen: t('dialog_open'),
          dialogTitle: t('dialog_title'),
          dialogBody: t('dialog_body'),
          dialogConfirm: t('dialog_confirm'),
          dialogCancel: t('dialog_cancel'),
          toast: t('toast'),
          toastSuccessOpen: t('toast_success_open'),
          toastErrorOpen: t('toast_error_open'),
          toastSuccess: t('toast_success'),
          toastError: t('toast_error'),
          toastClose: t('toast_close'),
        }}
      />
    </main>
  )
}
