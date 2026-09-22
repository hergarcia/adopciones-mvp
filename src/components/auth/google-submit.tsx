'use client'

import { useFormStatus } from 'react-dom'
import { Spinner } from '@/components/ui/button'
import { cn } from '@/lib/cn'

// La G tiene que quedar siempre sobre blanco (guía de marca de Google): al hover y al cargar cambia
// solo el bloque de tinta, nunca el talón.
export function GoogleSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="group/google afiche press perforado flex min-h-14 w-full items-stretch border-2 border-ink text-xl disabled:pointer-events-none"
    >
      <span className="flex w-14 shrink-0 items-center justify-center border-r-2 border-dashed border-ink bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element -- un SVG estático de 24 px no pasa por el optimizador de imágenes, que además no procesa SVG. */}
        <img src="/brand/google-g.svg" alt="" width={24} height={24} />
      </span>
      <span className="relative flex flex-1 items-center justify-center bg-ink px-4 text-canvas transition-colors duration-[var(--dur-fast)] ease-out group-hover/google:bg-canvas group-hover/google:text-ink">
        {pending ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        ) : null}
        <span className={cn(pending && 'opacity-0')}>{label}</span>
      </span>
    </button>
  )
}
