import { OG_PALETTE } from '@/lib/og/palette'
import { badgeParts, type BadgeLevel } from '@/lib/verification/badge-parts'

const BADGE_WIDTH = 72
const SCALE = BADGE_WIDTH / 56

// La chapita (`VerificationBadge`) a la escala del cartel: el único objeto de metal. El número del
// nivel 1 va encima del SVG y no adentro, porque `ImageResponse` dibuja el SVG sin las fuentes.
export function OgBadge({ level }: { level: BadgeLevel }) {
  const parts = badgeParts(level)
  const face = parts.fill === 'primary' ? OG_PALETTE.primary : OG_PALETTE.canvas
  return (
    <div style={{ display: 'flex', position: 'relative', width: BADGE_WIDTH, height: 68 * SCALE }}>
      <svg viewBox="0 0 56 68" width={BADGE_WIDTH} height={68 * SCALE}>
        <circle cx="28" cy="8" r="6.5" fill="none" strokeWidth="3" stroke={OG_PALETTE.metal} />
        <circle cx="28" cy="40" r="28" fill={OG_PALETTE.ink} />
        <circle
          cx="28"
          cy="40"
          r="26"
          strokeWidth="1"
          fill={OG_PALETTE.metalLight}
          stroke={OG_PALETTE.metal}
        />
        <circle cx="28" cy="40" r="22" fill={face} />
        {parts.fill === 'paper' ? (
          <circle cx="28" cy="40" r="21" fill="none" strokeWidth="2" stroke={OG_PALETTE.primary} />
        ) : null}
        {parts.ring ? (
          <circle cx="28" cy="40" r="18" fill="none" strokeWidth="2.5" stroke={OG_PALETTE.canvas} />
        ) : null}
        {parts.check ? (
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            transform="translate(16 28)"
            fill="none"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke={OG_PALETTE.canvas}
          />
        ) : null}
      </svg>
      {parts.check ? null : (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 18 * SCALE,
            width: BADGE_WIDTH,
            height: 44 * SCALE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: OG_PALETTE.primary,
          }}
        >
          {level}
        </span>
      )}
    </div>
  )
}
