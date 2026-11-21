import { BRAND_MARK_BOX, BrandMark, SIGNATURE } from '@/components/ui/brand-mark'
import { OG_PALETTE } from '@/lib/og/palette'

// Los recursos del cartel (docs/10 §Recursos del cartel) a la escala de una imagen armada en el
// servidor: la vista previa de un enlace, la de la portada y el cartel para el estado. Estilos en
// línea porque `ImageResponse` no lee clases.

type Size = { width: number; height: number }

/**
 * `.cinta-esquinas`: dos trozos cruzando las esquinas de arriba a 38°, y la foto apenas inclinada
 * (`--tilt`).
 */
export function OgTapedPhoto({ photo, size, tape }: { photo: string; size: Size; tape: Size }) {
  const piece = {
    position: 'absolute',
    top: -tape.height / 4,
    width: tape.width,
    height: tape.height,
    background: OG_PALETTE.tape,
  } as const

  return (
    <div style={{ display: 'flex', position: 'relative', transform: 'rotate(-0.8deg)' }}>
      {/* eslint-disable-next-line next/no-img-element */}
      <img src={photo} alt="" width={size.width} height={size.height} />
      <div style={{ ...piece, left: -tape.width * 0.3, transform: 'rotate(-38deg)' }} />
      <div style={{ ...piece, right: -tape.width * 0.3, transform: 'rotate(38deg)' }} />
    </div>
  )
}

type Strip = {
  label: string
  width: number
  fontSize: number
  padding: string
  tape: Size
}

/**
 * `.cinta`: un solo gesto, el trozo arriba al centro girado `--tilt-torn`. El bloque de tinta va
 * derecho y sin perforado: «Se busca hogar» se lee, y no es una acción.
 */
export function OgTapedStrip({ label, width, fontSize, padding, tape }: Strip) {
  return (
    <div style={{ display: 'flex', position: 'relative', width }}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          padding,
          background: OG_PALETTE.ink,
          color: OG_PALETTE.canvas,
          fontSize,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
      <OgTape holderWidth={width} tape={tape} />
    </div>
  )
}

/** El trozo de `.cinta`, arriba al centro de lo que sostiene, girado `--tilt-torn`. */
function OgTape({ holderWidth, tape }: { holderWidth: number; tape: Size }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: -tape.height / 2,
        left: (holderWidth - tape.width) / 2,
        width: tape.width,
        height: tape.height,
        background: OG_PALETTE.tape,
        transform: 'rotate(2deg)',
      }}
    />
  )
}

type PaperStrip = {
  /** Cada renglón ya cortado: el corte no se le deja al dibujo, que parte donde se llena. */
  lines: string[]
  width: number
  border: number
  padding: string
  fontSize: number
  color: string
  tape: Size
}

/**
 * La tira de papel con borde de tinta pegada con `.cinta`, la de lo verificado en `ProfileLevel`:
 * derecha, porque se lee.
 */
export function OgTapedPaper({ lines, width, border, padding, fontSize, color, tape }: PaperStrip) {
  return (
    <div style={{ display: 'flex', position: 'relative', width }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          padding,
          border: `${border}px solid ${OG_PALETTE.ink}`,
          background: OG_PALETTE.canvas,
          color,
          fontSize,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {lines.map((line) => (
          <span key={line} style={{ whiteSpace: 'nowrap' }}>
            {line}
          </span>
        ))}
      </div>
      <OgTape holderWidth={width} tape={tape} />
    </div>
  )
}

/** `.sello`: el color va en el texto y el borde lo hereda, puesto a mano y torcido. */
export function OgStamp({
  label,
  color,
  fontSize,
}: {
  label: string
  color: string
  fontSize: number
}) {
  return (
    <span
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        padding: `${fontSize * 0.14}px ${fontSize * 0.36}px`,
        border: `${Math.round(fontSize * 0.11)}px solid ${color}`,
        borderRadius: 6,
        background: OG_PALETTE.canvas,
        color,
        fontSize,
        lineHeight: 1.05,
        transform: 'rotate(-6deg)',
      }}
    >
      {label}
    </span>
  )
}

// La firma a la escala de la imagen, con las medidas de `.firma` (docs/10 §Marca). Centrarla en la
// caja del nombre es centrarla en las mayúsculas: con interlínea 0,95, la mitad del renglón de esta
// fuente cae a media altura de ellas. Va la compacta porque la tarjeta de un chat achica la imagen a
// un cuarto o un tercio: con el nombre desde 72 px, la pata queda entre 21 y 28 px.
export function OgSignature({ siteName, nameSize }: { siteName: string; nameSize: number }) {
  const markHeight = nameSize * SIGNATURE.markEm
  const markWidth = (markHeight * BRAND_MARK_BOX.width) / BRAND_MARK_BOX.height

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: nameSize * SIGNATURE.gapEm }}>
      <BrandMark version="compacta" fill={OG_PALETTE.ink} width={markWidth} height={markHeight} />
      <span
        style={{
          fontSize: nameSize,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: OG_PALETTE.ink,
        }}
      >
        {siteName}
      </span>
    </div>
  )
}
