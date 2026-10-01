import { OG_PALETTE } from '@/lib/og/palette'
import { SHARE_LAYOUT, shareNameSize } from '@/lib/og/share-layout'

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 }
export const SHARE_PHOTO_SIZE = { width: 440, height: 550 }
export const SHARE_FONT = 'Bricolage Grotesque Condensed'

type Props = {
  /** La portada entera, en 4:5 a 440 × 550, como data URL. */
  photo: string
  name: string
  zone: string
  /** El sello de una adoptada, ya traducido: va en lugar de la zona (spec #59, Edge Cases). */
  adopted?: string
  siteName: string
}

// El cartel reducido a una tarjeta de WhatsApp (plan §Vista previa): la portada entera pegada con
// cinta en el centro, el nombre a la izquierda y la zona a la derecha —o el sello «Adoptado», que la
// reemplaza—, sobre el papel. La foto
// entra entera en el cuadrado del centro, que es lo que muestra una miniatura chica, y los textos
// quedan fuera de él: la miniatura es el animal solo, sin letras cortadas. Nunca texto sobre la
// foto (docs/10 §Fotos). Las medidas son de la imagen, no de la escala de la pantalla: su fila está
// en docs/10. Estilos en línea porque `ImageResponse` no lee clases.
export function PetShareImage({ photo, name, zone, adopted, siteName }: Props) {
  const { margin, column, inset } = SHARE_LAYOUT

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: `0 ${margin}px`,
        background: OG_PALETTE.canvas,
        fontFamily: SHARE_FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignSelf: 'flex-start',
          width: column,
          paddingTop: inset,
          fontSize: shareNameSize(name),
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: OG_PALETTE.ink,
        }}
      >
        {name}
      </div>
      <TapedPhoto photo={photo} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignSelf: 'stretch',
          width: column,
          padding: `${inset}px 0`,
          color: OG_PALETTE.inkMuted,
        }}
      >
        {adopted ? (
          <AdoptedStamp label={adopted} />
        ) : (
          <span style={{ fontSize: 40, lineHeight: 1.05 }}>{zone}</span>
        )}
        <span style={{ fontSize: 28 }}>{siteName}</span>
      </div>
    </div>
  )
}

// `.sello` a la escala de la imagen, en yerba porque salió bien: el mismo sello de la ficha.
function AdoptedStamp({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        padding: '6px 16px',
        border: `5px solid ${OG_PALETTE.primary}`,
        borderRadius: 6,
        color: OG_PALETTE.primary,
        fontSize: 44,
        lineHeight: 1.05,
        transform: 'rotate(-6deg)',
      }}
    >
      {label}
    </span>
  )
}

// `.cinta-esquinas` a la escala de la imagen: dos trozos cruzando las esquinas de arriba a 38°, y
// la foto apenas inclinada (`--tilt`).
function TapedPhoto({ photo }: { photo: string }) {
  const tape = {
    position: 'absolute',
    top: -8,
    width: 80,
    height: 32,
    background: OG_PALETTE.tape,
  } as const

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        transform: 'rotate(-0.8deg)',
      }}
    >
      {/* eslint-disable-next-line next/no-img-element */}
      <img src={photo} alt="" width={SHARE_PHOTO_SIZE.width} height={SHARE_PHOTO_SIZE.height} />
      <div style={{ ...tape, left: -24, transform: 'rotate(-38deg)' }} />
      <div style={{ ...tape, right: -24, transform: 'rotate(38deg)' }} />
    </div>
  )
}
