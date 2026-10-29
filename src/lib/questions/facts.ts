import { MAX_ACTIVE_APPLICATIONS } from '@/lib/applications/rules'
import { FOLLOW_UP_DAYS, FOLLOW_UP_MAX_PHOTOS } from '@/lib/follow-ups/rules'
import { YOUNG_MAX, YOUNG_MIN_TO_PUBLISH } from '@/lib/litters/rules'
import { MAX_PHOTOS, PET_LIFETIME_DAYS, PET_REMINDER_DAYS } from '@/lib/pets/rules'
import {
  IDENTITY_EXPECTED_REVIEW_DAYS,
  IDENTITY_REJECTION_CAP,
  IDENTITY_REJECTION_WINDOW_DAYS,
  IDENTITY_REVIEW_TTL_DAYS,
} from '@/lib/verification/rules'

// Las cifras que dicen las páginas, desde las reglas que el sitio cumple de verdad: si una cambia,
// la página cambia sola (research R2 de la #8). Viajan como parámetros de cada texto.
export const QUESTION_FACTS = {
  expectedReviewDays: IDENTITY_EXPECTED_REVIEW_DAYS,
  reviewTtlDays: IDENTITY_REVIEW_TTL_DAYS,
  rejectionCap: IDENTITY_REJECTION_CAP,
  rejectionWindowDays: IDENTITY_REJECTION_WINDOW_DAYS,
  followUpDays: FOLLOW_UP_DAYS,
  followUpMaxPhotos: FOLLOW_UP_MAX_PHOTOS,
  petLifetimeDays: PET_LIFETIME_DAYS,
  petReminderDays: PET_REMINDER_DAYS,
  maxPetPhotos: MAX_PHOTOS,
  maxActiveApplications: MAX_ACTIVE_APPLICATIONS,
  youngMin: YOUNG_MIN_TO_PUBLISH,
  youngMax: YOUNG_MAX,
} as const
