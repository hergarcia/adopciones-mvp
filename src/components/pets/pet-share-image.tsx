import { OG_PALETTE } from '@/lib/og/palette'
import { countCharacters } from '@/lib/pets/char-count'

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 }
export const SHARE_PHOTO_SIZE = { width: 1200, height: 440 }
export const SHARE_FONT = 'Bricolage Grotesque Condensed'

type Props = {
  /** La portada ya recortada a 1200 × 440, como data URL. */
  photo: string
  name: string
  zone: string
  siteName: string
}

// La vista previa es el cartel reducido a una tarjeta de WhatsApp (plan §Vista previa): la foto
// arriba y, en el papel de abajo, el nombre y la zona. Nunca texto sobre la foto (docs/10 §Fotos).
// Las medidas son de la imagen, no de la escala de la pantalla: su fila está en docs/10. Estilos en
// línea porque `ImageResponse` no lee clases.
export function PetShareImage({ photo, name, zone, siteName }: Props) {
  const nameSize = countCharacters(name) > 18 ? 64 : 88

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: OG_PALETTE.canvas,
        fontFamily: SHARE_FONT,
      }}
    >
      {/* eslint-disable-next-line next/no-img-element */}
      <img
        src={photo}
        alt=""
        width={SHARE_PHOTO_SIZE.width}
        height={SHARE_PHOTO_SIZE.height}
        style={{ objectFit: 'cover' }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexGrow: 1,
          padding: '0 48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: nameSize,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            color: OG_PALETTE.ink,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: 8,
            color: OG_PALETTE.inkMuted,
          }}
        >
          <span style={{ fontSize: 36 }}>{zone}</span>
          <span style={{ fontSize: 28 }}>{siteName}</span>
        </div>
      </div>
    </div>
  )
}
