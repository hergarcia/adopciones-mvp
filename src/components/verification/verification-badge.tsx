import { cva } from 'class-variance-authority'
import Link from 'next/link'
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { badgeParts, type BadgeLevel } from '@/lib/verification/badge-parts'

// El disco mide 40 px en `md` y 56 en `lg`; la argolla suma arriba lo suyo.
const badge = cva('block h-auto shrink-0', {
  variants: {
    size: { md: 'w-10', lg: 'w-14' },
  },
  defaultVariants: { size: 'md' },
})

type Props = {
  level: BadgeLevel
  size?: 'md' | 'lg'
  /** A la explicación de los niveles, o nulo donde la chapita ya está en ella. */
  href: string | null
  /** Ya traducida: «Verificado, nivel 2. Qué significa», o sin la segunda frase si no enlaza. */
  label: string
  className?: string
}

const CENTER = { x: 28, y: 40 }

// La chapita del collar: el único objeto de metal en un mundo de papel (docs/10 §Principios 2).
// Un SVG sin JavaScript; qué se dibuja por nivel lo decide `badgeParts`. El brillo corre una vez,
// solo en la `lg`, que es la del momento: el perfil público y la verificación aprobada.
export function VerificationBadge({ level, size = 'md', href, label, className }: Props) {
  const clipId = useId()
  const parts = badgeParts(level)
  const face = parts.fill === 'primary' ? 'fill-primary' : 'fill-canvas'

  // Sin enlace, el SVG es la imagen y lleva la etiqueta; con enlace, la etiqueta es del enlace.
  const named = href === null ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  const art = (
    <svg {...named} viewBox="0 0 56 68" className={cn(badge({ size }), href === null && className)}>
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
      {parts.ring ? (
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="18.5"
          fill="none"
          strokeWidth="1.5"
          className="stroke-ink"
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
      {size === 'lg' ? (
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

  if (href === null) return art
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      className={cn('press inline-block shrink-0', className)}
    >
      {art}
    </Link>
  )
}
