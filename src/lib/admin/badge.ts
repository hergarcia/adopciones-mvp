const BADGE_MAX = 99

/** El número entre paréntesis de «Administrar»: sin número con 0, «99+» pasado 99 (FR-020). */
export function badgeCount(count: number): string | null {
  if (count <= 0) return null
  return count > BADGE_MAX ? `${BADGE_MAX}+` : String(count)
}
