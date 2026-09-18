// Ningún hexadecimal en un componente: el color sale de los tokens de docs/10, que viven una sola
// vez en globals.css. oxlint no trae `no-restricted-syntax`, así que esta fila de docs/09
// §Compuertas es una regla propia del repo, hosteada por el linter.
const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

const MESSAGE =
  'Hexadecimal en un componente. El color sale de un token de docs/10 §Tokens (var(--color-…)); ' +
  'un valor que no está en ese doc no existe.'

function reportIfHex(context, node, text) {
  if (typeof text === 'string' && HEX.test(text)) {
    context.report({ message: MESSAGE, node })
  }
}

export default {
  create(context) {
    return {
      Literal(node) {
        reportIfHex(context, node, node.value)
      },
      TemplateElement(node) {
        reportIfHex(context, node, node.value?.raw)
      },
    }
  },
}
