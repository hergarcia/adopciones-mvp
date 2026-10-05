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
// izquierda; a la derecha la tira pegada con cinta. Estilos en línea porque `ImageResponse` no
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

// `.cinta` a la escala de la imagen: un solo gesto, el trozo arriba al centro girado `--tilt-torn`.
// El bloque va derecho y sin perforado: «Se busca hogar» se lee, y no es una acción (docs/10
// §Recursos del cartel).
function TapedStrip({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', position: 'relative', width: 420 }}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          padding: '48px 32px',
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
          position: 'absolute',
          top: -16,
          left: 170,
          width: 80,
          height: 32,
          background: OG_PALETTE.tape,
          transform: 'rotate(2deg)',
        }}
      />
    </div>
  )
}
