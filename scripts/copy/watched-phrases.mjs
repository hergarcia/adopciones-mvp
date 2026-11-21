// Las frases vigiladas de la guía de redacción sin vicios (skill `sin-slop`, references/deteccion.md):
// lo que se puede atrapar con una expresión regular en los textos que lee la gente. Atrapa frases,
// no la forma de un párrafo: las tríadas, los cierres que repiten y el folleto se revisan leyendo.

// En JavaScript, \b no reconoce las letras con tilde: los límites de palabra van con \p{L}.
const phrase = (pattern) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'giu')

export const WATCHED = [
  {
    pattern: 'contraste armado',
    regex: /(?<!\p{L})(?:no|nunca) es\s[^.!?\n]{1,80}?[,:;]\s*(?:es|son|sino)(?!\p{L})/giu,
  },
  {
    pattern: 'contraste armado',
    regex:
      /(?<!\p{L})no (?:solo|sólo|solamente|únicamente)\s[^.!?\n]{1,120}?(?<!\p{L})sino(?!\p{L})/giu,
  },
  {
    pattern: 'contraste armado',
    regex: /(?<!\p{L})no se trata de\s[^.!?\n]{1,120}?(?<!\p{L})sino(?!\p{L})/giu,
  },
  {
    pattern: 'contraste en dos oraciones',
    regex:
      /(?<!\p{L})no (?:significa|quiere decir)\s[^.!?\n]{1,120}\.\s*(?:significa|quiere decir)(?!\p{L})/giu,
  },
  { pattern: 'cola negativa', regex: phrase('sin vueltas|sin sorpresas|sin letra chica') },
  // Un título entero que no nombra lo que contiene: «Lo que queda», «Lo que no promete».
  {
    pattern: 'título que no dice nada',
    regex:
      /^\s*lo que (?:no )?(?:realmente )?(?:queda|importa|sigue|viene|cuenta|hay|promete|significa|cambia|sabemos|hacemos)[.:]?\s*$/giu,
  },
  {
    pattern: 'frase que suena profunda',
    regex: phrase(
      'la verdadera pregunta es|en el fondo|en esencia|lo que realmente importa|el corazón del asunto',
    ),
  },
  {
    pattern: 'pregunta que se responde sola',
    regex:
      /¿(?:la buena noticia|el resultado|la mejor parte|lo mejor|por qué importa|la clave|el secreto)\?/giu,
  },
  {
    pattern: 'arranque escenificado',
    regex: phrase(
      'sin más preámbulos|vamos a sumergirnos|exploremos|seamos honestos|' +
        'esto es lo que (?:tenés que|hay que|necesitás) saber',
    ),
  },
  { pattern: 'cierre dramático', regex: phrase('así de simple|así de fácil|y eso lo cambia todo') },
  {
    pattern: 'importancia inflada',
    regex: phrase(
      'clave|crucial(?:es)?|fundamental(?:es)?|primordial(?:es)?|esencial(?:es)?|' +
        'marca un antes y un después|juega un (?:papel|rol)|sienta las bases|deja una huella|' +
        'en constante evolución|lo mejor está por venir',
    ),
  },
  {
    pattern: 'muletilla',
    regex: phrase(
      'cabe (?:destacar|mencionar|señalar|resaltar)|' +
        'es importante (?:destacar|señalar|mencionar|resaltar|tener en cuenta|recordar)|' +
        'vale la pena (?:mencionar|destacar)|en el mundo actual|en la era digital|hoy más que nunca|' +
        'a la hora de|en lo que respecta a|en términos de|al final del día|dicho esto|' +
        'sin lugar a dudas|en definitiva',
    ),
  },
  {
    pattern: 'gerundio colgado',
    regex:
      /,\s*(?:convirtiéndose|consolidándose|posicionándose|garantizando|permitiendo)(?!\p{L})/giu,
  },
  {
    pattern: 'folleto',
    regex: phrase(
      'en el corazón de|experiencia (?:única|inigualable)|tu bienestar es nuestra prioridad|' +
        'calidad y calidez|te tenemos cubiert[oa]|estamos para vos|cada huella cuenta|' +
        'una segunda oportunidad',
    ),
  },
  { pattern: 'calco', regex: phrase('hace(?:r)? sentido|juga(?:r)? un rol|en base a') },
  {
    pattern: 'resto de chatbot',
    regex: phrase('¡claro!|no dudes en|espero que te sirva|¡ups!|algo salió mal'),
  },
  { pattern: 'texto que habla de sí mismo', regex: phrase('a continuación|en esta sección') },
  { pattern: 'negrita decorativa', regex: /\*\*[^*]+\*\*|<(?:b|strong)>/giu },
]

// Una frase citada a propósito («pagá el flete y te lo mando») habla de la frase, no la usa.
const QUOTED = /«[^»]*»|“[^”]*”|"[^"]*"/gu

const unquoted = (text) => text.replace(QUOTED, (quote) => ' '.repeat(quote.length))

/** Cada frase vigilada del texto, con el patrón que la nombra. */
export function findWatched(text) {
  const clean = unquoted(text)
  return WATCHED.flatMap(({ pattern, regex }) =>
    [...clean.matchAll(regex)].map((match) => ({ pattern, phrase: match[0].trim() })),
  )
}

/** Recorre un catálogo de mensajes anidado y devuelve cada hallazgo con su clave. */
export function scanMessages(messages, prefix = '') {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string')
      return findWatched(value).map((found) => ({ key: path, ...found }))
    if (value && typeof value === 'object') return scanMessages(value, path)
    return []
  })
}
