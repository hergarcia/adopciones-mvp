import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  // Next 16.3 escribe un bloque de reglas propias dentro de CLAUDE.md y AGENTS.md cuando detecta
  // un agente. Se apaga: CLAUDE.md es el contrato del proyecto y ya obliga a cargar el skill
  // `vercel:nextjs` antes de tocar App Router, así que el bloque repite eso con menos autoridad y
  // se reescribe solo en cada cambio de versión. Decisión de Hernán (2026-09-18).
  agentRules: false,
  // Para abrir `pnpm dev` desde el celular en la misma red: sin esto Next 16 le responde 403 a los
  // pedidos de /_next/* que no vienen de localhost y la página llega sin estilos ni JavaScript.
  // Solo rige en desarrollo.
  allowedDevOrigins: ['192.168.*.*'],
  experimental: {
    serverActions: {
      // Una foto de un animal viaja sola en su acción con sus tres tamaños, que juntos no pasan de
      // 1,5 MB (lib/pets/rules.ts). El default de 1 MB la cortaría; 2 MB deja lugar al multipart
      // sin abrir la puerta a cargas grandes (research R2 de la historia #53).
      bodySizeLimit: '2mb',
    },
  },
}

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')

export default withNextIntl(nextConfig)
