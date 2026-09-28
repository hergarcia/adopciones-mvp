// La proporción de una foto en la pared (4:5, como sale del teléfono; docs/10 §Fotos). La usan la
// card, su skeleton y los casilleros del formulario: cualquier foto puede pasar a portada con un
// toque, así que cada casillero muestra el recorte con el que la van a ver en la pared.
export const WALL_PHOTO_FRAME = 'aspect-[4/5]'

// La invitación a la primera foto ocupa la fila entera, así que deja de ser cuadrada al
// ensancharse: mide lo mismo de alto en el teléfono que en la hoja ancha. La usan el campo y su
// skeleton.
export const EMPTY_INVITATION_FRAME = 'aspect-square sm:aspect-[3/2] lg:aspect-[5/2]'
