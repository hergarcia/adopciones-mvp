// Interpretación de argumentos del driver y sus códigos de salida.
//   0 todo bien · 1 una ruta falló · 2 la app no está levantada · 3 invocación inválida
export const EXIT = { ok: 0, routeFailed: 1, appDown: 2, badInvocation: 3 }

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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

  const routes = argv.filter((a) => a.startsWith('/')).filter((a, i, all) => all.indexOf(a) === i)

  return {
    story,
    routes: routes.length > 0 ? routes : ['/'],
    desktop: flags.has('--desktop'),
    headed: flags.has('--headed'),
  }
}
