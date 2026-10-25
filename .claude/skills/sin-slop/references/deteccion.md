# Detección automática

Con una lista de frases se puede armar un chequeo que falle en el CI, como hace el Slop Score de EQ-Bench (palabras
de moda, contrastes y trigramas). Sirve para que los vicios no vuelvan a entrar, pero no reemplaza la lectura: atrapa
las frases, no la forma de un párrafo.

## Cómo armarlo

1. **Juntá el texto que lee la gente:**
   - las cadenas de los archivos de contenido, los datos y los componentes;
   - o, mejor, el texto visible del HTML generado, que no tiene código mezclado.

   Dejá afuera el código, las URLs, los identificadores y las citas textuales (reseñas, normas), que van tal cual
   aunque tengan un vicio.
2. **Dos niveles:**
   - **Fuerte:** una aparición hace fallar el chequeo.
   - **Densidad:** las palabras de moda fallan solo si se juntan (por ejemplo, 3 o más en un mismo texto).
3. **Excepciones con motivo.** Una lista blanca de frases o archivos, cada una con el porqué. Sin motivo no entra.
4. **Mensaje útil:** que el error diga el archivo, la frase y el patrón, para corregir sin abrir la skill.

## Expresiones regulares

En JavaScript, `\b` no reconoce las letras con tilde. Usá límites con `\p{L}` y la bandera `u`.

```ts
// Los vicios de redacción de la IA que se pueden atrapar con una expresión regular (skill sin-slop,
// references/deteccion.md). El e2e de redacción pasa por acá el texto que lee la gente en cada página. Atrapa frases,
// no la forma de un párrafo: las tríadas, los cierres y el folleto se revisan leyendo.
//
// En JavaScript, \b no reconoce las letras con tilde: los límites de palabra se arman con \p{L} y la bandera u.

/** Una frase completa, sin cortar palabras: "clave" no coincide dentro de "claves" ni de "enclave". */
const frase = (patron: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${patron})(?![\\p{L}\\p{N}])`, 'iu');

export interface Vicio {
  /** El nombre del patrón en el catálogo de la skill: va en el mensaje de error. */
  patron: string;
  regex: RegExp;
}

/** Una sola aparición hace fallar el chequeo. */
export const FUERTES: readonly Vicio[] = [
  // A. Escenificar en vez de afirmar
  { patron: 'contraste armado', regex: /(?<![\p{L}])no es\s[^.!?\n]{1,80}?[,:;]\s*(?:es|son)(?![\p{L}])/iu },
  // La forma española más común: "no es X, sino Y", también con "nunca" o "casi nunca".
  {
    patron: 'contraste armado',
    regex: /(?<![\p{L}])(?:no|nunca|casi nunca) es\s[^.!?\n]{1,80}?,\s*sino(?![\p{L}])/iu,
  },
  {
    patron: 'contraste armado',
    regex: /(?<![\p{L}])no (?:solo|sólo|solamente|únicamente)\s[^.!?\n]{1,120}?(?<![\p{L}])sino(?![\p{L}])/iu,
  },
  { patron: 'contraste armado', regex: /(?<![\p{L}])no se trata de\s[^.!?\n]{1,120}?(?<![\p{L}])sino(?![\p{L}])/iu },
  {
    patron: 'contraste en dos oraciones',
    regex: /(?<![\p{L}])no (?:significa|quiere decir)\s[^.!?\n]{1,120}\.\s*(?:significa|quiere decir)(?![\p{L}])/iu,
  },
  // La cola negativa del contraste (patrón 1 del catálogo): nombra un problema que nadie planteó.
  { patron: 'cola negativa', regex: frase('sin vueltas|sin sorpresas|sin letra chica') },
  {
    patron: 'pregunta que se responde sola',
    regex: /¿(?:la buena noticia|el resultado|la mejor parte|lo mejor|por qué importa|la clave|el secreto)\?/iu,
  },
  {
    patron: 'arranque escenificado',
    regex: frase(
      'sin más preámbulos|vamos a sumergirnos|exploremos|seamos honestos|' +
        'esto es lo que (?:tenés que|tienes que|hay que|necesitás|necesitas) saber',
    ),
  },
  { patron: 'cierre dramático', regex: frase('así de simple|así de fácil|y eso lo cambia todo|punto final') },
  // C. Inflación
  {
    patron: 'importancia inflada',
    regex: frase(
      'marc(?:a|ó|ar|ando|aron) un antes y un después|juega un (?:papel|rol) (?:clave|fundamental|crucial|esencial)|sienta las bases|' +
        'deja(?:r)? una huella|en constante evolución|el futuro es prometedor|lo mejor está por venir',
    ),
  },
  {
    patron: 'muletilla',
    regex: frase(
      'cabe (?:destacar|mencionar|señalar|resaltar)|es importante (?:destacar|señalar|mencionar|resaltar|tener en cuenta|recordar)|' +
        'vale la pena (?:mencionar|destacar)|en el mundo actual|en la era digital|en el panorama actual|hoy más que nunca|' +
        'al final del día|dicho esto|sin lugar a dudas',
    ),
  },
  {
    patron: 'gerundio colgado',
    regex: /,\s*(?:convirtiéndose|consolidándose|posicionándose|erigiéndose|afianzándose)(?![\p{L}])/iu,
  },
  {
    patron: 'folleto',
    regex: frase(
      'en el corazón de|un entorno único|experiencia (?:única|inigualable)|su bienestar es nuestra prioridad|' +
        'tu bienestar es nuestra prioridad|calidad y calidez|te tenemos cubiert[oa]',
    ),
  },
  {
    patron: 'autoridad prestada',
    regex: frase(
      'los expertos coinciden|diversos estudios (?:demuestran|indican)|está (?:científicamente )?comprobado',
    ),
  },
  // D. Calcos
  { patron: 'calco', regex: frase('hace(?:r)? sentido|juga(?:r)? un rol|en base a') },
  {
    // Sin cruzar un salto de línea: un día con mayúscula al principio de un renglón (una fila de una tabla) está bien.
    patron: 'día o mes con mayúscula',
    regex:
      /[\p{Ll},][^\S\n]+(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábados?|Domingos?|Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Setiembre|Octubre|Noviembre|Diciembre)(?![\p{L}])/u,
  },
  // F. Restos del chat
  {
    patron: 'resto de chatbot',
    regex: frase(
      '¡claro!|excelente pregunta|espero que (?:esto )?te sirva|no dudes en|no dude en|aquí tienes|aquí tenés',
    ),
  },
  {
    patron: 'texto que habla de sí mismo',
    regex: frase(
      'en este artículo (?:exploraremos|veremos|te contamos)|a continuación|como vimos anteriormente|en esta sección|' +
        'la tabla (?:de abajo )?(?:muestra|compara)',
    ),
  },
];

/** Palabras de moda: una sola no dice nada; varias juntas, sí. */
export const DENSIDAD = frase(
  'crucial(?:es)?|fundamental(?:es)?|primordial(?:es)?|holístic[oa]s?|robust[oa]s?|sinergias?|potencia(?:r|mos|ndo)|' +
    'fomenta(?:r|mos|ndo)|desbloquea(?:r|ndo)?|un abanico de|una amplia gama de|ecosistemas?|navega(?:r|ndo)|' +
    'sumergi(?:r|rse|te)|adentra(?:r|rse|te)|profundiza(?:r|mos) en|transformador(?:a|es)?|innovador(?:a|es)?|' +
    'de vanguardia|de primer nivel|meticulos[oa]s?|vibrantes?|excelencia|comprometid[oa]s con',
);

/** Por texto o por página: hasta 2 palabras de moda pasan; 3 o más fallan. */
export const DENSIDAD_MAXIMA = 2;

/** Para revisar a mano: pueden ser correctos, así que no hacen fallar el chequeo. */
export const REVISAR: readonly Vicio[] = [
  {
    patron: 'gerundio que puede estar colgado',
    regex:
      /,\s*(?:garantizando|destacando|reflejando|contribuyendo|permitiendo|brindando|ofreciendo|asegurando)(?![\p{L}])/iu,
  },
  { patron: 'raya como conector', regex: /\s—\s/u },
  { patron: 'pregunta sin signo de apertura', regex: /(?:^|[.!?]\s+)(?![^.!?\n]*¿)[^.!?\n]{3,}\?/u },
];

export interface Hallazgo {
  patron: string;
  /** La frase tal como está en el texto. */
  frase: string;
}

/** Todas las apariciones de un vicio, no solo la primera: una excepción de la lista blanca no tapa a las demás. */
function apariciones({ patron, regex }: Vicio, texto: string): Hallazgo[] {
  const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  return [...texto.matchAll(global)].map((m) => ({ patron, frase: m[0] }));
}

/** Los vicios fuertes de un texto, y las palabras de moda si se pasan de la densidad. */
export function buscarSlop(texto: string): Hallazgo[] {
  const hallazgos = FUERTES.flatMap((v) => apariciones(v, texto));
  const moda = apariciones({ patron: 'palabras de moda', regex: DENSIDAD }, texto);
  if (moda.length > DENSIDAD_MAXIMA) {
    hallazgos.push({ patron: 'palabras de moda', frase: moda.map((m) => m.frase).join(', ') });
  }
  return hallazgos;
}

/** Lo que conviene leer de nuevo a mano: gerundios, rayas y preguntas sin signo de apertura. */
export function buscarParaRevisar(texto: string): Hallazgo[] {
  return REVISAR.flatMap((v) => apariciones(v, texto));
}
```

## Falsos positivos conocidos

- **"No es X, es Y" con información en las dos mitades:** "No es obligatorio, es recomendable" puede ser legítimo.
  Va a la lista blanca con el motivo, o se reescribe ("Es recomendable, aunque no obligatorio").
- **Citas textuales** (reseñas, normas, nombres de leyes): se excluyen al juntar el texto, no con la lista blanca.
- **Un día con mayúscula al empezar una línea de una tabla o de una lista:** la expresión exige minúscula o coma
  antes, así que no lo marca.
- **"Fundamental" o "crucial" en un texto médico, donde es literal:** cuentan para la densidad, pero una sola no
  falla.
