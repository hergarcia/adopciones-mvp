import { getTranslations } from 'next-intl/server'
import { Block } from './block'

// Los recursos del cartel que no son primitivas sino utilidades: el sello es el que usan los
// componentes de dominio para marcar un estado (docs/10 §Recursos del cartel).
export async function ResourcesBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('resources')}>
      <p>
        <span className="sello text-base text-ink">{t('stamp_sample')}</span>
      </p>
    </Block>
  )
}
