import { OG_PALETTE } from '@/lib/og/palette'
import {
  POSTER_LAYOUT,
  POSTER_SIZE,
  posterAddressSize,
  posterNameSize,
} from '@/lib/og/poster-layout'
import { SHARE_FONT } from '@/lib/og/share-image'
import { badgeParts, type BadgeLevel } from '@/lib/verification/badge-parts'
import { OgStamp, OgTapedPhoto, OgTapedStrip } from './og-paper'

/** Todo ya traducido: el cartel de un animal o de una camada. */
export type PosterCard = {
  /** La portada a la medida de `POSTER_LAYOUT.photo`, como data URL. */
  photo: string
  tagline: string
  urgent: string | null
  /** «En proceso», el sello de la ficha; null si no lleva. */
  stamp: string | null
  name: string
  /** Especie, sexo y edad; el tamaño de adulto; la zona; de una camada, cuántas crías quedan. */
  lines: readonly string[]
  /** Lo que tiene verificado quien publicó, en palabras; null si no se sabe. */
  level: { value: BadgeLevel; text: string } | null
  invite: string
  /** La dirección de la ficha, para tipearla. */
  address: string
  siteName: string
}

const COLUMN = POSTER_SIZE.width - POSTER_LAYOUT.margin * 2
const TAPE = { width: 104, height: 42 }

// El cartel de «se busca hogar» para un estado o una historia (historia #275): la tira de tinta
// arriba, la portada pegada con cinta y, si hace falta, los sellos apoyados en su borde; debajo el
// nombre en voz de afiche, los datos, la chapita con el nivel de quien publica y la dirección grande
// al pie. Nunca texto de lectura sobre la foto (docs/10 §Fotos): los sellos son estados.
export function PetPoster({ card }: { card: PosterCard }) {
  const { margin, inset, photo } = POSTER_LAYOUT

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: `${inset}px ${margin}px`,
        background: OG_PALETTE.canvas,
        color: OG_PALETTE.ink,
        fontFamily: SHARE_FONT,
      }}
    >
      <OgTapedStrip
        label={card.tagline}
        width={COLUMN}
        fontSize={88}
        padding="28px 32px"
        tape={TAPE}
      />
      <div style={{ display: 'flex', position: 'relative', marginTop: 64 }}>
        <OgTapedPhoto photo={card.photo} size={photo} tape={TAPE} />
        <PosterStamps urgent={card.urgent} stamp={card.stamp} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'stretch',
          flexGrow: 1,
          marginTop: 56,
          gap: 24,
        }}
      >
        <span
          style={{
            display: 'flex',
            fontSize: posterNameSize(card.name),
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
          }}
        >
          {card.name}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 46, lineHeight: 1.15 }}>
          {card.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        {card.level === null ? null : <PosterLevel level={card.level} />}
        <PosterFooter invite={card.invite} address={card.address} siteName={card.siteName} />
      </div>
    </div>
  )
}

// Apoyados en el borde de abajo de la foto, como el sello de la ficha: «Urgente» en ceibo, el único
// acento del cartel, y «En proceso» en tinta.
function PosterStamps({ urgent, stamp }: { urgent: string | null; stamp: string | null }) {
  if (urgent === null && stamp === null) return null
  return (
    <div style={{ display: 'flex', position: 'absolute', left: -24, bottom: -28, gap: 20 }}>
      {urgent === null ? null : <OgStamp label={urgent} color={OG_PALETTE.accent} fontSize={52} />}
      {stamp === null ? null : <OgStamp label={stamp} color={OG_PALETTE.ink} fontSize={52} />}
    </div>
  )
}

function PosterLevel({ level }: { level: NonNullable<PosterCard['level']> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <OgBadge level={level.value} />
      <span style={{ fontSize: 40, lineHeight: 1.1, color: OG_PALETTE.primary }}>{level.text}</span>
    </div>
  )
}

function PosterFooter({
  invite,
  address,
  siteName,
}: Pick<PosterCard, 'invite' | 'address' | 'siteName'>) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginTop: 'auto',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 36, color: OG_PALETTE.inkMuted }}>{invite}</span>
      <span
        style={{ fontSize: posterAddressSize(address), lineHeight: 1, letterSpacing: '-0.01em' }}
      >
        {address}
      </span>
      <span style={{ fontSize: 32, color: OG_PALETTE.inkMuted, marginTop: 16 }}>{siteName}</span>
    </div>
  )
}

const BADGE_WIDTH = 72
const SCALE = BADGE_WIDTH / 56

// La chapita (`VerificationBadge`) a la escala del cartel: el único objeto de metal. El número del
// nivel 1 va encima del SVG y no adentro, porque `ImageResponse` dibuja el SVG sin las fuentes.
function OgBadge({ level }: { level: BadgeLevel }) {
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
