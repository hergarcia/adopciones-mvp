import { STALE_PAGE_MINUTES } from './rules'

// Las firmas de las fotos duran una hora: pasados 50 minutos desde que se firmaron, la pantalla las
// pide de nuevo antes de que venzan (research R11, FR-018).
export function isStale(signedAt: string, now: Date): boolean {
  return now.getTime() - Date.parse(signedAt) >= STALE_PAGE_MINUTES * 60_000
}
