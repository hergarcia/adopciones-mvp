import type { DepartmentCode } from '@/lib/zones/departments'

/** Una persona cuyo aval cuenta, como la muestra el perfil público: lo que su propio perfil muestra. */
export type Voucher = {
  publicId: string
  displayName: string
  department: DepartmentCode
  locality: string
  hasPhoto: boolean
}

/** Lo que cualquiera ve de otra persona (FR-005). Los meses, `YYYY-MM-01` de Uruguay. */
export type PublicProfile = {
  publicId: string
  displayName: string
  department: DepartmentCode
  locality: string
  isRescuer: boolean
  hasPhoto: boolean
  memberSince: string
  levelOne: boolean
  identitySince: string | null
  vouchers: Voucher[]
}

/** La relación entre quien mira y la persona mirada (R6). */
export type VouchStanding = {
  viewerVouches: boolean
  targetVouchesViewer: boolean
  blockedByTarget: boolean
}

export type VouchDirection = 'given' | 'received'

/** Una fila de «Mis avales» (FR-025). `givenOn`, el día de Uruguay. */
export type MyVouch = {
  direction: VouchDirection
  otherPublicId: string
  otherDisplayName: string
  otherHasPhoto: boolean
  givenOn: string
  mineLacksLevelTwo: boolean
  otherLacksLevelTwo: boolean
}

/** Los motivos de FR-013 por los que un aval no se da. */
export const VOUCH_REFUSALS = [
  'self',
  'reciprocal',
  'blocked',
  'vouchee_level',
  'voucher_level',
] as const
export type VouchRefusal = (typeof VOUCH_REFUSALS)[number]

export type GiveOutcome = 'given' | 'not_found' | VouchRefusal
export type WithdrawOutcome = 'withdrawn' | 'absent'
export type RemoveOutcome = 'removed' | 'absent'
