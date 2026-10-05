'use client'

import { useAfterOpen } from '@/hooks/use-after-open'

const loadLive = () => import('./stale-images-refresh-live')

// Renovar las firmas de las fotos pasa después de abrir: recién abierta, la página las trae nuevas
// (historia #95).
export function StaleImagesRefresh({ signedAt }: { signedAt: string }) {
  const live = useAfterOpen(loadLive)
  return live === null ? null : <live.StaleImagesRefreshLive signedAt={signedAt} />
}
