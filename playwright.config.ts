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
  webServer: {
    command: 'pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
