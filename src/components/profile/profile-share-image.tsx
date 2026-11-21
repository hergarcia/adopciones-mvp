import { OG_PALETTE } from '@/lib/og/palette'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { SHARE_LAYOUT, profileLevelSize } from '@/lib/og/share-layout'

type Props = {
  /** El nivel en las palabras de la chapita, ya traducido. */
  levelText: string
  siteName: string
}

// La vista previa del enlace de un perfil (historia #280): el papel del cartel con el nivel en el
// verde de lo verificado y el nombre del sitio, sin foto ni nombre de la persona, porque la imagen es
// la misma para todos los de un nivel. Todo va dentro del cuadrado del centro, lo que muestra una
// miniatura chica. Estilos en línea porque `ImageResponse` no lee clases; su fila está en docs/10.
export function ProfileShareImage({ levelText, siteName }: Props) {
  const { inset } = SHARE_LAYOUT

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: `${inset}px 0`,
        background: OG_PALETTE.canvas,
        fontFamily: SHARE_FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          width: SHARE_IMAGE_SIZE.height,
          textAlign: 'center',
          fontSize: profileLevelSize(levelText),
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: OG_PALETTE.primary,
        }}
      >
        {levelText}
      </div>
      <span style={{ fontSize: 28, color: OG_PALETTE.inkMuted }}>{siteName}</span>
    </div>
  )
}
