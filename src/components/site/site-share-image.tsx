import { OgSignature, OgTapedStrip } from '@/components/pets/og-paper'
import { OG_PALETTE } from '@/lib/og/palette'
import { SHARE_FONT } from '@/lib/og/share-image'
import { SHARE_LAYOUT } from '@/lib/og/share-layout'

type Props = {
  siteName: string
  phrase: string
  /** «Se busca hogar», ya traducido. */
  tagline: string
}

// La vista previa de la portada (research R5): el cartel sin foto, porque la dirección del sitio no
// es de ningún animal ni de ninguna persona (FR-025). La firma y la frase en tinta a la izquierda; a
// la derecha la tira pegada con cinta. Estilos en línea porque `ImageResponse` no lee clases; las
// medidas son de la imagen, no de la escala de la pantalla.
export function SiteShareImage({ siteName, phrase, tagline }: Props) {
  const { margin, inset } = SHARE_LAYOUT

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: `${inset}px ${margin}px`,
        background: OG_PALETTE.canvas,
        color: OG_PALETTE.ink,
        fontFamily: SHARE_FONT,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: 600, gap: 32 }}>
        <OgSignature siteName={siteName} nameSize={96} />
        <span style={{ fontSize: 44, lineHeight: 1.1 }}>{phrase}</span>
      </div>
      <OgTapedStrip
        label={tagline}
        width={420}
        fontSize={72}
        padding="48px 32px"
        tape={{ width: 80, height: 32 }}
      />
    </div>
  )
}
