// Las dos filas de docs/09 §Compuertas que oxlint no trae de fábrica, como plugin del propio repo.
// Viven dentro del linter y no en un script aparte: un comando, un reporte, una configuración.
import noHexColorInComponent from './no-hex-color-in-component.mjs'
import noUseClientInRouteEntry from './no-use-client-in-route-entry.mjs'

export default {
  meta: {
    name: 'adopciones',
  },
  rules: {
    'no-hex-color-in-component': noHexColorInComponent,
    'no-use-client-in-route-entry': noUseClientInRouteEntry,
  },
}
