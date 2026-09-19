import { getTranslations } from 'next-intl/server'
import { Skeleton } from '@/components/ui/skeleton'
import { Block } from './block'

export async function SkeletonBlock() {
  const t = await getTranslations('common.showcase')

  return (
    <Block title={t('skeleton')}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    </Block>
  )
}
