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
// es de ningún animal ni de ninguna persona (FR-025). El nombre en afiche y la frase en tinta a la
// izquierda; a la derecha la tirita pegada con cinta. Estilos en línea porque `ImageResponse` no
// lee clases; las medidas son de la imagen, no de la escala de la pantalla.
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
        <span style={{ fontSize: 128, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
          {siteName}
        </span>
        <span style={{ fontSize: 44, lineHeight: 1.1 }}>{phrase}</span>
      </div>
      <TapedStrip label={tagline} />
    </div>
  )
}

// La tirita de la portada a la escala de la imagen: el bloque de tinta con el borde perforado abajo,
// sostenido por un trozo de cinta (`.cinta`) arriba al centro e inclinado como algo pegado a mano.
function TapedStrip({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        width: 420,
        transform: 'rotate(-3deg)',
      }}
    >
      <span
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '48px 32px 40px',
          background: OG_PALETTE.ink,
          color: OG_PALETTE.canvas,
          fontSize: 72,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          height: 24,
          background: OG_PALETTE.ink,
          borderTop: `4px dashed ${OG_PALETTE.canvas}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: 170,
          width: 80,
          height: 32,
          background: OG_PALETTE.tape,
        }}
      />
    </div>
  )
}
