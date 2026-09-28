import { z } from 'zod'
import { SAVE_FAILURE_REASONS, SAVE_MOMENTS } from '@/lib/analytics/events'

export const PROFILE_SAVE_REPORT_MAX = 20

// La acción que lo recibe no pide sesión, para no perder los fallos de quien se quedó sin ella: lo
// que entra tiene que ser solo enums y booleanos, sin lugar para un texto (FR-022).
export const profileSaveReportSchema = z.strictObject({
  failures: z
    .array(
      z.strictObject({
        reason: z.enum(SAVE_FAILURE_REASONS),
        moment: z.enum(SAVE_MOMENTS),
        first: z.boolean(),
      }),
    )
    .min(1)
    .max(PROFILE_SAVE_REPORT_MAX),
})

export type ProfileSaveReport = z.infer<typeof profileSaveReportSchema>
