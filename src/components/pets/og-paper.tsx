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
      <div
        style={{
          position: 'absolute',
          top: -tape.height / 2,
          left: (width - tape.width) / 2,
          width: tape.width,
          height: tape.height,
          background: OG_PALETTE.tape,
          transform: 'rotate(2deg)',
        }}
      />
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
