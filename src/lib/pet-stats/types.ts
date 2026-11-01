import type { Sex } from '@/lib/pets/options'

export type PublicationKind = 'pet' | 'litter'

export type PublicationStats = {
  opens: number
  taps: number
  phoneStops: number
  identityStops: number
  applications: number
  /** AAAA-MM-DD, día de Uruguay. */
  countedSince: string
  /** Falso en lo publicado antes de la historia #269, que se cuenta desde `countedSince`. */
  fromPublication: boolean
  requiredLevel: 1 | 2
  code: string
  name: string
  /** Null en una camada, que se nombra en femenino. */
  sex: Sex | null
}

export type ApplyCount = { tap: boolean; stop: 'phone' | 'identity' | null }
