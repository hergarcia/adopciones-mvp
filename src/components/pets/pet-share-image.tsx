import { OG_PALETTE } from '@/lib/og/palette'
import { SHARE_FONT } from '@/lib/og/share-image'
import { SHARE_LAYOUT, shareNameSize } from '@/lib/og/share-layout'
import { OgStamp, OgTapedPhoto } from './og-paper'
import type { ShareImageLevel } from './share-preview-texts'

export const SHARE_PHOTO_SIZE = { width: 440, height: 550 }
const TAPE = { width: 80, height: 32 }

type Props = {
  /** La portada entera, en 4:5 a 440 × 550, como data URL. */
  photo: string
  name: string
  zone: string
  /** El sello de una adoptada, ya traducido: va en lugar de la zona (spec #59, Edge Cases). */
  adopted?: string
  /** El nivel de quien publicó, ya traducido; sin nivel, la imagen no dice ninguno. */
  level?: ShareImageLevel
  siteName: string
}

// El cartel reducido a una tarjeta de WhatsApp (plan §Vista previa): la portada entera pegada con
// cinta en el centro, el nombre a la izquierda y la zona a la derecha —o el sello «Adoptado», que la
// reemplaza— con «Quien publica» y su nivel debajo, en el verde de lo verificado, sobre el papel. La foto
// entra entera en el cuadrado del centro, que es lo que muestra una miniatura chica, y los textos
// quedan fuera de él: la miniatura es el animal solo, sin letras cortadas. Nunca texto sobre la
// foto (docs/10 §Fotos). Las medidas son de la imagen, no de la escala de la pantalla: su fila está
// en docs/10. Estilos en línea porque `ImageResponse` no lee clases.
export function PetShareImage({ photo, name, zone, adopted, level, siteName }: Props) {
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
      <OgTapedPhoto photo={photo} size={SHARE_PHOTO_SIZE} tape={TAPE} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {adopted ? (
            // En yerba porque salió bien: el mismo sello de la ficha.
            <OgStamp label={adopted} color={OG_PALETTE.primary} fontSize={44} />
          ) : (
            <span style={{ fontSize: 40, lineHeight: 1.05 }}>{zone}</span>
          )}
          {level ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 28, lineHeight: 1.05 }}>{level.lead}</span>
              <span style={{ fontSize: 34, lineHeight: 1.05, color: OG_PALETTE.primary }}>
                {level.text}
              </span>
            </div>
          ) : null}
        </div>
        <span style={{ fontSize: 28 }}>{siteName}</span>
      </div>
    </div>
  )
}
