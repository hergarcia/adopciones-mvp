import { APP_NAME } from '@/lib/config'

// Portada provisoria mínima. US4 le pone los tokens y el idioma; US5 la deja como la del wireframe.
export default function Home() {
  return (
    <main>
      <h1>{APP_NAME}</h1>
    </main>
  )
}
