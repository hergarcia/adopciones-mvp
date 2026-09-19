// `"use client"` solo en la hoja más chica, nunca en la entrada de una ruta: una página compone y
// busca datos, y marcarla como cliente arrastra todo el árbol al browser (docs/08 §Server vs.
// Client). Regla propia porque oxlint no trae `no-restricted-syntax`.
const ROUTE_ENTRY = /[/\\](page|layout)\.tsx$/

const MESSAGE =
  '"use client" en la entrada de una ruta. Va en la hoja más chica que necesita estado, no en ' +
  'page.tsx ni layout.tsx (docs/08 §Server vs. Client).'

function filenameOf(context) {
  if (typeof context.filename === 'string') return context.filename
  if (typeof context.getFilename === 'function') return context.getFilename()
  return ''
}

function isUseClient(statement) {
  return (
    statement?.type === 'ExpressionStatement' &&
    statement.expression?.type === 'Literal' &&
    statement.expression.value === 'use client'
  )
}

export default {
  create(context) {
    if (!ROUTE_ENTRY.test(filenameOf(context))) return {}

    return {
      Program(node) {
        for (const statement of node.body) {
          // Las directivas van antes de cualquier import; en cuanto aparece otra cosa, terminaron.
          if (statement.type !== 'ExpressionStatement') break
          if (isUseClient(statement)) {
            context.report({ message: MESSAGE, node: statement })
          }
        }
      },
    }
  },
}
