// La marca que deja `ReviewDecision` al resolver y lee `ReviewNotice` en la pantalla a la que se
// llega. Fuera del componente cliente: importada desde ahí, el servidor recibe una referencia de
// cliente y no el objeto.
export const REVIEW_SAVED_FLAG = { approve: 'aprobado', reject: 'rechazado' } as const
