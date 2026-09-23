// Las Server Actions no lanzan: devuelven esto (docs/08 §Dónde vive la lógica que se repite). El
// `error` es una clave de i18n, nunca un texto, así que la redacción vive en un solo lugar.
// `seconds` acompaña a los errores que traen una espera, para que el mensaje pueda decir cuánto
// falta en vez de un «esperá» pelado (US1-AS7). `detail` lleva lo que el mensaje de una acción
// necesita además de la clave —los intentos que quedan, a qué número—, tipado por cada acción en
// vez de sumar campos opcionales al tipo que comparten todas.
export type ActionResult<T, D = never> =
  { ok: true; data: T } | { ok: false; error: string; seconds?: number; detail?: D }
