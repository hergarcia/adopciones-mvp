import type { Page } from '@playwright/test'

export function uniqueEmail(): string {
  return `prueba+${crypto.randomUUID()}@example.test`
}

// Con Google configurado, el correo queda cerrado detrás de «Prefiero entrar con mi correo»; sin
// Google, como en CI, está a la vista (FR-011). La prueba es la misma en los dos entornos.
export async function openEmailSignIn(page: Page): Promise<void> {
  const fallback = page.getByText(/prefiero entrar con mi correo/i)
  if (await fallback.isVisible()) await fallback.click()
}
