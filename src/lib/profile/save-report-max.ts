// Cuántos fallos viajan en un reporte. Vive solo y no junto al schema que lo hace cumplir: el
// formulario lo usa al abrir, y el schema trae zod, que baja recién al guardar (historia #326).
// Tampoco va en save-failure.ts, que comparten las pantallas de animales y lo cargaría en ellas.
export const PROFILE_SAVE_REPORT_MAX = 20
