import { startGoogleSignIn } from '@/actions/auth'

// Una tirita con talón: el corte punteado la parte en dos, el talón de papel lleva la G y el
// bloque de tinta la acción. La G es la oficial y va siempre sobre blanco, lo único que la guía de
// marca de Google no deja tocar (docs/10 §Componentes); por eso al hover se invierte solo el
// bloque. La pantalla lo monta solo si hay credenciales (FR-011).
export function GoogleButton({ label }: { label: string }) {
  return (
    <form action={startGoogleSignIn}>
      <button
        type="submit"
        className="group/google afiche press perforado flex min-h-14 w-full items-stretch border-2 border-ink text-xl"
      >
        <span className="flex w-14 shrink-0 items-center justify-center border-r-2 border-dashed border-ink bg-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element -- un SVG estático de 24 px no pasa por el optimizador de imágenes, que además no procesa SVG. */}
          <img src="/brand/google-g.svg" alt="" width={24} height={24} />
        </span>
        <span className="flex flex-1 items-center justify-center bg-ink px-4 text-canvas transition-colors duration-[var(--dur-fast)] ease-out group-hover/google:bg-canvas group-hover/google:text-ink">
          {label}
        </span>
      </button>
    </form>
  )
}
