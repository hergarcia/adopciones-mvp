import { getTranslations } from 'next-intl/server'
import { BrandMark } from '@/components/ui/brand-mark'
import { Block } from './block'

// Cada dibujo de la marca a un alto de su rango: principal a 64 px, compacta a 24, mínima a 20.
export async function BrandMarkBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('brand_mark')}>
      <div className="flex items-end gap-6 text-ink">
        <BrandMark version="principal" className="h-16 w-auto" />
        <BrandMark version="compacta" className="h-6 w-auto" />
        <BrandMark version="minima" className="h-5 w-auto" />
      </div>
    </Block>
  )
}
