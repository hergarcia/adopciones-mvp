import type { ContactKind } from './contact-match'

// Los casos de la regla de contacto, compartidos por su test y por el de paridad del perfil (SC-003
// de la historia #12): el perfil tiene que rechazar y dejar pasar exactamente lo mismo que la ficha,
// así que las dos pruebas leen la misma tabla.

/** [caso, texto, tipo, fragmento que cita el error] */
export const CONTACT_CASES: readonly (readonly [string, string, ContactKind, string])[] = [
  ['celular con espacios', 'Llamame al 099 123 456 cuando quieras', 'phone', '099 123 456'],
  ['celular sin el 0', 'Escribime 99 123 456', 'phone', '99 123 456'],
  ['celular pegado', 'Tel 099123456', 'phone', '099123456'],
  ['celular con puntos', 'Es 099.123.456 o nada', 'phone', '099.123.456'],
  ['celular con guiones', 'Es 099-123-456', 'phone', '099-123-456'],
  ['celular con guiones y espacios', 'Es 099 - 123 - 456', 'phone', '099 - 123 - 456'],
  ['celular con espacios dobles', 'Es 099  123  456', 'phone', '099  123  456'],
  ['celular con prefijo', 'Desde afuera +598 99.123.456', 'phone', '+598 99.123.456'],
  ['fijo de 8', 'Fijo 2901 2345, de tarde', 'phone', '2901 2345'],
  ['años solo con espacios', 'Rescatada entre 2023 2024', 'phone', '2023 2024'],
  ['número de chip', 'Chip 858000012345678', 'phone', '858000012345678'],
  ['un correo', 'Escribí a ana@gmail.com y te cuento', 'email', 'ana@gmail.com'],
  [
    'un correo al final de la oración',
    'Mi correo: luna.rescate@hotmail.com.',
    'email',
    'luna.rescate@hotmail.com',
  ],
  ['http sin s', 'Mirá http://rescate.example', 'web', 'http://rescate.example'],
  ['http', 'Mirá https://rescate.example/luna', 'web', 'https://rescate.example/luna'],
  ['www', 'En www.rescate.example', 'web', 'www.rescate.example'],
  ['un dominio con barra', 'Seguila en instagram.com/luna', 'web', 'instagram.com/luna'],
  ['un dominio al final', 'Estamos en fb.com', 'web', 'fb.com'],
  ['un dominio con otro punto', 'Ver rescate.org.uy hoy', 'web', 'rescate.org.uy'],
  ['un dominio .net', 'Ver huellas.net', 'web', 'huellas.net'],
  ['un dominio .uy en mayúsculas', 'Ver HUELLAS.UY', 'web', 'HUELLAS.UY'],
  ['un dominio seguido de coma', 'En fb.com, o donde sea', 'web', 'fb.com'],
  ['wa.me', 'Escribime por wa.me', 'web', 'wa.me'],
  ['wa.me con número', 'wa.me/59899123456', 'web', 'wa.me/59899123456'],
  ['t.me', 'Por t.me/luna', 'web', 't.me/luna'],
  ['bit.ly', 'bit.ly/abc', 'web', 'bit.ly/abc'],
  ['tinyurl.com', 'tinyurl.com/abc', 'web', 'tinyurl.com/abc'],
  ['linktr.ee', 'Todo en linktr.ee/luna', 'web', 'linktr.ee/luna'],
  ['un usuario', 'Seguinos en @luna.rescate', 'social', '@luna.rescate'],
  ['un usuario con guion bajo', '@_luna', 'social', '@_luna'],
  ['un usuario entre paréntesis', 'Nuestra cuenta (@luna)', 'social', '@luna'],
  ['un usuario entre dos paréntesis', 'Nuestra cuenta ((@luna))', 'social', '@luna'],
  ['un enlace con paréntesis adentro', 'linktr.ee/luna(rescate)', 'web', 'linktr.ee/luna(rescate'],
  ['un dominio con signos al final', 'Mirá fb.com!!', 'web', 'fb.com'],
]

/** [caso, texto] que no son contacto. */
export const PASSING_CASES: readonly (readonly [string, string])[] = [
  ['una fecha con puntos', 'Llegó el 12.03.2025'],
  ['una fecha con espacios', 'Llegó el 12 03 2025'],
  ['una fecha con barras', 'Llegó el 12/03/2025'],
  ['una fecha con guiones', 'Llegó el 1-3-2025'],
  ['una fecha del siglo pasado', 'Nació el 31.12.1999'],
  ['una fecha con espacios dobles', 'Llegó el 12  03  2025'],
  ['una fecha con espacios alrededor de los puntos', 'Llegó el 12 . 03 . 2025'],
  ['dos fechas de un dígito seguidas', 'Vacunas: 5.3.2025 10.4.2025'],
  ['una fecha de un dígito seguida de un número', 'Castrada el 5.3.2025 15 días después'],
  ['una ruta y un kilómetro', 'La encontramos en Ruta 8 km 25'],
  ['un peso', 'Pesa 12,5 kg y come 300 g'],
  ['años con coma', 'Rescatada entre 2023, 2024'],
  ['siete dígitos', 'Código 1234567'],
  ['un punto sin espacio antes de una palabra', 'Está castrada.Come de todo'],
  ['otro', 'Es muy buena.Como un peluche'],
  ['una arroba suelta', 'Juega @ toda hora'],
  ['un correo disfrazado', 'juan arroba gmail punto com'],
  ['un texto común', 'Luna es tranquila, le gustan los gatos y los niños.'],
  ['vacío', ''],
]

/** [texto, si tiene un número de puerta] */
export const STREET_NUMBER_CASES: readonly (readonly [string, boolean])[] = [
  ['Av. Italia 3456', true],
  ['Calle 123', true],
  ['Villa 25 de Agosto', false],
  ['Km 16', false],
  ['Pocitos', false],
]
