// Interpretación de argumentos del driver y sus códigos de salida.
//   0 todo bien · 1 una ruta falló · 2 la app no está levantada · 3 invocación inválida
export const EXIT = { ok: 0, routeFailed: 1, appDown: 2, badInvocation: 3 }

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const KNOWN_FLAGS = new Set(['--story', '--user', '--desktop', '--headed'])
const WINDOWS_PATH = /^[a-z]:[/\\]/i

// Un argumento que no se entiende corta la corrida: ignorarlo en silencio recorría solo la
// portada y salía con 0, que es lo que pasa cuando Git Bash reescribe `/muestra` como una ruta
// de Windows.
function unknownArgument(argv, storyIndex) {
  const stray = argv.find(
    (arg, index) => index !== storyIndex + 1 && !arg.startsWith('/') && !KNOWN_FLAGS.has(arg),
  )
  if (stray === undefined) return undefined
  if (WINDOWS_PATH.test(stray)) {
    return (
      `"${stray}" no es una ruta de la app: Git Bash reescribió el argumento. ` +
      'Anteponé MSYS_NO_PATHCONV=1 al comando.'
    )
  }
  return stray.startsWith('--')
    ? `No conozco la opción ${stray}.`
    : `"${stray}" no es una ruta: las rutas empiezan con "/".`
}

export function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')))
  const storyIndex = argv.indexOf('--story')
  const story = storyIndex >= 0 ? argv[storyIndex + 1] : undefined

  if (flags.has('--user')) {
    return {
      error:
        'La opción --user llega con la historia de registro e ingreso: todavía no hay ingreso, ' +
        'y recorrer como anónimo en silencio sería mentir sobre lo que se capturó.',
    }
  }
  if (story === undefined || story.startsWith('--')) {
    return { error: 'Falta --story <slug>. Las capturas van a .artifacts/<slug>/.' }
  }
  if (!SLUG.test(story)) {
    return { error: `El slug "${story}" no sirve: minúsculas, números y guiones simples.` }
  }

  const stray = unknownArgument(argv, storyIndex)
  if (stray !== undefined) return { error: stray }

  const routes = argv.filter((a) => a.startsWith('/')).filter((a, i, all) => all.indexOf(a) === i)

  return {
    story,
    routes: routes.length > 0 ? routes : ['/'],
    desktop: flags.has('--desktop'),
    headed: flags.has('--headed'),
  }
}
