// Las Server Actions no lanzan: devuelven esto (docs/08 §Dónde vive la lógica que se repite). El
// `error` es una clave de i18n, nunca un texto, así que la redacción vive en un solo lugar.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }
