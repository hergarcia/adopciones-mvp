import Link from 'next/link'
import { PosterSketch } from './poster-sketch'

type Option = { href: string; label: string; hint: string }

type Props = {
  /** Ya traducidas. */
  pet: Option
  litter: Option
}

// Las dos respuestas de publicar (FR-001): dos enlaces, sin JavaScript. Pesan lo mismo, así que
// ninguna es la tirita.
export function PublishKindChoice({ pet, litter }: Props) {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      <li>
        <PublishKindOption id="publicar-animal" option={pet} stacked={false} />
      </li>
      <li>
        <PublishKindOption id="publicar-camada" option={litter} stacked />
      </li>
    </ul>
  )
}

type OptionProps = { id: string; option: Option; stacked: boolean }

// El nombre del enlace es la respuesta y la línea lo describe: leída como parte del nombre, un
// lector de pantalla diría la explicación entera en cada respuesta.
function PublishKindOption({ id, option, stacked }: OptionProps) {
  return (
    <Link
      href={option.href}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-hint`}
      className="lift flex h-full items-center gap-4 border-2 border-line p-4 pt-6 [--lift-tilt:0deg] hover:border-ink sm:flex-col sm:items-start sm:gap-6"
    >
      <PosterSketch stacked={stacked} className="w-20 shrink-0 sm:w-28" />
      <span className="flex flex-col gap-1">
        <span id={`${id}-label`} className="afiche text-xl text-ink">
          {option.label}
        </span>
        <span id={`${id}-hint`} className="text-sm text-ink-muted">
          {option.hint}
        </span>
      </span>
    </Link>
  )
}
