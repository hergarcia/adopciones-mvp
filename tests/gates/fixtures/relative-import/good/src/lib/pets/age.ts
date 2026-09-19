const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30

export function ageInMonths(bornAt: Date) {
  return Math.floor((Date.now() - bornAt.getTime()) / MS_PER_MONTH)
}
