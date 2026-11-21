import { OgSignature, OgTapedPaper } from '@/components/pets/og-paper'
import { OG_PALETTE } from '@/lib/og/palette'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import {
  PROFILE_LEVEL_STRIP,
  SHARE_LAYOUT,
  levelLines,
  profileLevelSize,
} from '@/lib/og/share-layout'

type Props = {
  /** El nivel en las palabras de la chapita, ya traducido. */
  levelText: string
  siteName: string
}

const TAPE = { width: 80, height: 32 }
const SIGNATURE_SIZE = 72

// La vista previa del enlace de un perfil (historia #280): el nivel en la tira de papel pegada con
// cinta de `ProfileLevel`, en el verde de lo verificado, y la firma del sitio debajo. Sin foto ni
// nombre de la persona, porque la imagen es la misma para todos los de un nivel. Todo va dentro del
// cuadrado del centro, lo que muestra una miniatura chica. Estilos en línea porque `ImageResponse`
// no lee clases; su fila está en docs/10.
export function ProfileShareImage({ levelText, siteName }: Props) {
  const { inset } = SHARE_LAYOUT
  const { width, border, padding } = PROFILE_LEVEL_STRIP

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
        }}
      >
        <OgTapedPaper
          lines={levelLines(levelText)}
          width={width}
          border={border}
          padding={`${padding.block}px ${padding.inline}px`}
          fontSize={profileLevelSize(levelText)}
          color={OG_PALETTE.primary}
          tape={TAPE}
        />
      </div>
      <OgSignature siteName={siteName} nameSize={SIGNATURE_SIZE} />
    </div>
  )
}
