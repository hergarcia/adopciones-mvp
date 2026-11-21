// El cartel de la ficha, de un animal y de una camada, y de su espera: la foto a sangre arriba y la
// lectura debajo; desde 1024, dos columnas, la galería `sticky` a la izquierda (docs/10 §Pantallas
// anchas). La espera usa las mismas clases para que, al llegar la ficha, nada se corra.
export const SHEET_COLUMNS = 'flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10'

export const SHEET_GALLERY = 'relative -mx-gutter md:-mx-gutter-wide lg:sticky lg:top-0 lg:mr-0'

export const SHEET_READING = 'flex max-w-[var(--measure)] flex-col gap-6'

/** La tirita de la ficha: fija abajo en el teléfono, en su lugar desde 768 (docs/10 §Layout). */
export const SHEET_STICKY_ACTION =
  'sticky bottom-0 z-10 -mx-gutter flex flex-col gap-3 bg-canvas px-gutter py-3 md:static md:mx-0 md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:bg-transparent md:p-0'
