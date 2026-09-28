// Los campos del formulario de un animal en la medida de lectura y, desde 1024, en dos columnas
// dentro de la hoja (docs/10 §Pantallas anchas): el formulario más largo del producto no queda como
// una columna angosta con un tercio de la hoja vacío. Lo usan el formulario y su skeleton.
export const PET_FORM_COLUMNS =
  'flex max-w-[var(--measure)] flex-col gap-8 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-x-12'

export const PET_FORM_COLUMN = 'flex min-w-0 flex-col gap-8'

// Las fotos en la medida de lectura y, desde 1024, las cinco en una fila de la hoja ancha. Lo usan
// el campo de fotos y su skeleton.
export const PET_PHOTOS_WIDTH = 'max-w-[var(--measure)] lg:max-w-none'
export const PET_PHOTO_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'
