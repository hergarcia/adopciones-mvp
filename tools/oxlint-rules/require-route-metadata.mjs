// Una pantalla que no dice qué es no existe para nadie: ni para un buscador, ni para un answer
// engine, ni para la tarjeta que arma WhatsApp cuando alguien comparte el link. El título y la
// descripción se escriben donde se escribe la pantalla (docs/08 §Encontrable); una pasada de SEO al
// final es retrabajo sobre todo lo ya construido.
const ROUTE_PAGE = /[/\\]page\.tsx$/

const METADATA_EXPORTS = new Set(['metadata', 'generateMetadata'])

const MESSAGE =
  'Esta ruta no exporta `metadata` ni `generateMetadata`. Toda page.tsx declara su título y su ' +
  'descripción, con los textos en messages/es.json (docs/08 §Encontrable).'

function filenameOf(context) {
  if (typeof context.filename === 'string') return context.filename
  if (typeof context.getFilename === 'function') return context.getFilename()
  return ''
}

// Las tres formas de exportar valen: `export const metadata`, `export async function
// generateMetadata` y `export { metadata }` al final del archivo.
function exportsMetadata(statement) {
  if (statement.type !== 'ExportNamedDeclaration') return false

  const declaration = statement.declaration
  if (declaration?.type === 'VariableDeclaration') {
    return declaration.declarations.some((declarator) => METADATA_EXPORTS.has(declarator.id?.name))
  }
  if (declaration?.type === 'FunctionDeclaration') {
    return METADATA_EXPORTS.has(declaration.id?.name)
  }
  return (statement.specifiers ?? []).some((specifier) =>
    METADATA_EXPORTS.has(specifier.exported?.name),
  )
}

export default {
  create(context) {
    if (!ROUTE_PAGE.test(filenameOf(context))) return {}

    return {
      Program(node) {
        if (!node.body.some(exportsMetadata)) {
          context.report({ message: MESSAGE, node })
        }
      },
    }
  },
}
