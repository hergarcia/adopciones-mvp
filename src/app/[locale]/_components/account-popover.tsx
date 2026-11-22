import { button } from '@/components/ui/button-styles'
import { ChevronDownIcon, CloseIcon } from '@/components/ui/icons'
import { closeButton } from '@/components/ui/overlay-styles'
import { cn } from '@/lib/cn'
import { CloseMenuOnNavigate } from './close-menu-on-navigate'

type Props = {
  /** Lo que dice el botón, ya armado: «Mi cuenta» o «Mi cuenta (5)» con su texto para el lector. */
  trigger: React.ReactNode
  /** «Mi cuenta», el título de la hoja en el teléfono. */
  title: string
  /** «Cerrar», el nombre de la cruz. */
  close: string
  children: React.ReactNode
}

const MENU_ID = 'menu-cuenta'

// El menú de la cuenta sobre `popover` del navegador: abre, cierra con Escape y al tocar afuera, y
// lleva el foco sin una librería. En el teléfono es una hoja que sube, como `Sheet`; desde 1024 cuelga
// del botón. Se dibuja en el servidor: lo único que ejecuta es cerrarse al navegar
// (`CloseMenuOnNavigate`), y así su marcado no baja como código en cada pantalla (historia #350).
export function AccountPopover({ trigger, title, close, children }: Props) {
  return (
    <span className="group/cuenta flex">
      <button
        type="button"
        popoverTarget={MENU_ID}
        className={cn(
          button({ variant: 'ghost', size: 'sm' }),
          'cursor-pointer gap-2 [anchor-name:--cuenta] sm:text-lg',
        )}
      >
        {trigger}
        {/* En el teléfono la flecha empujaba «Mi cuenta» a un segundo renglón; ahí el menú sube como hoja. */}
        <ChevronDownIcon className="size-4 transition-transform max-sm:hidden duration-[var(--dur-base)] ease-out group-has-[:popover-open]/cuenta:rotate-180" />
      </button>
      <nav
        id={MENU_ID}
        popover="auto"
        aria-label={title}
        className="inset-x-0 top-auto bottom-0 m-0 max-h-[80dvh] w-full max-w-none overflow-y-auto border-0 border-t-2 border-ink bg-canvas p-6 text-ink shadow-float transition-[opacity,translate,overlay,display] transition-discrete duration-[var(--dur-base)] ease-out backdrop:bg-ink/40 translate-y-4 opacity-0 open:translate-y-0 open:opacity-100 starting:open:translate-y-4 starting:open:opacity-0 lg:top-16 lg:right-6 lg:bottom-auto lg:left-auto lg:w-rail lg:border-2 lg:px-5 lg:pt-2 lg:pb-3 lg:backdrop:bg-transparent supports-[anchor-name:--a]:lg:top-[calc(anchor(bottom)+var(--spacing)*2)] supports-[anchor-name:--a]:lg:right-[anchor(right)] supports-[anchor-name:--a]:lg:[position-anchor:--cuenta]"
      >
        <div className="flex items-center justify-between lg:hidden">
          <p className="afiche text-2xl">{title}</p>
          <button
            type="button"
            popoverTarget={MENU_ID}
            popoverTargetAction="hide"
            aria-label={close}
            className={cn(closeButton, '-mr-3 cursor-pointer')}
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div>{children}</div>
        <CloseMenuOnNavigate id={MENU_ID} />
      </nav>
    </span>
  )
}
