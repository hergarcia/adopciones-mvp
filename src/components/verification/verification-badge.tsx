import { cva } from 'class-variance-authority'
import { useId } from 'react'
import { badgeParts, type BadgeLevel } from '@/lib/verification/badge-parts'

// El disco mide 24 px en `sm`, 40 en `md` y 56 en `lg`; la argolla suma arriba lo suyo.
const badge = cva('block h-auto shrink-0', {
  variants: {
    size: { sm: 'w-6', md: 'w-10', lg: 'w-14' },
  },
  defaultVariants: { size: 'md' },
})

type Props = {
  level: BadgeLevel
  /** `sm` es decorativa, al lado de un texto que ya lo dice (`RequiredLevelLine`). */
  size?: 'sm' | 'md' | 'lg'
  /** Ya traducida: «Verificado, nivel 2»; nula adentro de `VerificationBadgeLink`, que la lleva. */
  label: string | null
  /** Solo la `lg` brilla, y no donde ya se vio brillar: en `/niveles` es la misma que se tocó. */
  shine?: boolean
}

const CENTER = { x: 28, y: 40 }

// La chapita del collar: el único objeto de metal en un mundo de papel (docs/10 §Principios 2).
// Un SVG sin JavaScript; qué se dibuja por nivel lo decide `badgeParts`. El brillo corre una vez,
// solo en la `lg`, que es la del momento: el perfil público y la verificación aprobada. La que
// enlaza a la explicación es `VerificationBadgeLink`, en su propio archivo: así su código baja solo
// en las pantallas donde se toca.
export function VerificationBadge({ level, size = 'md', label, shine = size === 'lg' }: Props) {
  const clipId = useId()
  const parts = badgeParts(level)
  const face = parts.fill === 'primary' ? 'fill-primary' : 'fill-canvas'

  // Sola, el SVG es la imagen y lleva la etiqueta; en el enlace, la etiqueta es del enlace.
  const named = label === null ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label }
  return (
    <svg {...named} viewBox="0 0 56 68" className={badge({ size })}>
      <circle cx={CENTER.x} cy="8" r="6.5" fill="none" strokeWidth="3" className="stroke-metal" />
      <circle cx={CENTER.x} cy={CENTER.y} r="28" className="fill-ink" />
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r="26"
        strokeWidth="1"
        className="fill-metal-light stroke-metal"
      />
      <circle cx={CENTER.x} cy={CENTER.y} r="22" className={face} />
      {parts.fill === 'paper' ? (
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="21"
          fill="none"
          strokeWidth="2"
          className="stroke-primary"
        />
      ) : null}
      {/* En papel y no en tinta: la tinta sobre la yerba no llega a 3:1 y a 40 px el nivel 3 se leía
          igual que el 2 (docs/10, VerificationBadge). */}
      {parts.ring ? (
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="18"
          fill="none"
          strokeWidth="2.5"
          className="stroke-canvas"
        />
      ) : null}
      {parts.check ? (
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          transform={`translate(${CENTER.x - 12} ${CENTER.y - 12})`}
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-canvas"
        />
      ) : (
        <text
          x={CENTER.x}
          y={CENTER.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="afiche fill-primary text-xl"
        >
          {level}
        </text>
      )}
      {shine ? (
        <>
          <clipPath id={clipId}>
            <circle cx={CENTER.x} cy={CENTER.y} r="26" />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <g className="brillo">
              <rect
                x={CENTER.x - 9}
                y="0"
                width="18"
                height="80"
                transform={`rotate(25 ${CENTER.x} ${CENTER.y})`}
                className="fill-canvas opacity-50"
              />
            </g>
          </g>
        </>
      ) : null}
    </svg>
  )
}
