import { ageInMonths } from './age'

export function isPuppy(bornAt: Date) {
  return ageInMonths(bornAt) < 12
}
