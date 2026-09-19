// `react/jsx-no-literals` solo ve el texto JSX suelto (`<p>Tobi</p>`). Se le escapan los textos
// visibles que viajan por atributo (`placeholder="Tu nombre"`, `aria-label`, `title`, `alt`) y los
// que van dentro de una expresión (`{urgent ? 'Urgente' : 'Sin apuro'}`), que son justo los que se
// cuelan cuando alguien "solo agrega un placeholder". Esta regla cubre ese punto ciego.
// Los atributos de HTML que se ven o se escuchan, más las props de texto de las primitivas de
// ui/: una primitiva nueva que reciba texto por otra prop la suma acá.
const VISIBLE_ATTRIBUTES = new Set([
  'placeholder',
  'title',
  'alt',
  'label',
  'description',
  'message',
  'error',
  'closeLabel',
  'regionLabel',
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-valuetext',
])

const MESSAGE =
  'Texto visible literal. Todo texto que ve o escucha una persona sale de messages/es.json ' +
  '(docs/06 §Convenciones de claves); en ui/ llega ya traducido por props.'

const hasLetters = (text) => typeof text === 'string' && /\p{L}/u.test(text)

// Los literales con letras que una expresión puede terminar mostrando.
function visibleLiterals(expression) {
  if (!expression) return []
  switch (expression.type) {
    case 'Literal':
      return hasLetters(expression.value) ? [expression] : []
    case 'TemplateLiteral':
      return expression.quasis.some((quasi) => hasLetters(quasi.value?.raw)) ? [expression] : []
    case 'ConditionalExpression':
      return [...visibleLiterals(expression.consequent), ...visibleLiterals(expression.alternate)]
    case 'LogicalExpression':
      return [...visibleLiterals(expression.left), ...visibleLiterals(expression.right)]
    default:
      return []
  }
}

function report(context, nodes) {
  for (const node of nodes) context.report({ message: MESSAGE, node })
}

function reportChildren(context, node) {
  for (const child of node.children) {
    if (child.type === 'JSXExpressionContainer') {
      report(context, visibleLiterals(child.expression))
    }
  }
}

export default {
  create(context) {
    return {
      JSXAttribute(node) {
        const name = node.name?.name
        if (typeof name !== 'string' || !VISIBLE_ATTRIBUTES.has(name)) return
        const value = node.value
        if (value?.type === 'Literal') report(context, visibleLiterals(value))
        if (value?.type === 'JSXExpressionContainer') {
          report(context, visibleLiterals(value.expression))
        }
      },
      JSXElement(node) {
        reportChildren(context, node)
      },
      JSXFragment(node) {
        reportChildren(context, node)
      },
    }
  },
}
