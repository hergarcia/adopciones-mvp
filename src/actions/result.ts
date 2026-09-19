// Las Server Actions no lanzan: devuelven esto (docs/08 §Dónde vive la lógica que se repite). El
// `error` es una clave de i18n, nunca un texto, así que la redacción vive en un solo lugar.
// `seconds` acompaña a los errores que traen una espera, para que el mensaje pueda decir cuánto
// falta en vez de un «esperá» pelado (US1-AS7).
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; seconds?: number }
