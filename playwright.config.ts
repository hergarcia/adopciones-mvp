import { defineConfig, devices } from '@playwright/test'

// Los flujos críticos llegan con publicar, solicitar y aceptar (docs/09 §Qué vale la pena testear).
// La configuración existe desde F00 para que la etapa exista y se vea correr; `pnpm e2e` pasa con
// --pass-with-no-tests y dice que no había nada que verificar (FR-017).
const PORT = 3000
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  // Contra el build de producción, que es lo que pide docs/09, no contra `next dev`.
  //
  // `reuseExistingServer: false` también en local, aunque cueste unos segundos por corrida: con
  // `true`, un `pnpm dev` olvidado en el puerto 3000 hacía que la prueba corriera contra el build
  // de desarrollo sin decir nada, y ahí el formulario todavía no hidratado se envía de forma
  // nativa. Se estaba probando otra cosa y el resultado parecía legítimo.
  webServer: {
    command: 'pnpm start',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    // La prueba lee el enlace del buzón en disco, así que el correo **no** puede salir de verdad.
    // Con una `RESEND_API_KEY` en .env.local saldría: el servidor de la prueba la hereda, y como
    // la dirección sintética no es la de la cuenta, Resend la rechaza, no se escribe ningún
    // archivo y la prueba falla por algo que no tiene que ver con lo que prueba. Vacía y no
    // borrada: Next no pisa lo que ya está en el entorno, y `optionalEnv` toma vacío por ausente.
    env: { RESEND_API_KEY: '' },
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
