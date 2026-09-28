# Contratos: rutas, acciones y vista previa

## Rutas

| Ruta | Grupo | Sesión | Qué es |
|---|---|---|---|
| `/animales` | `(public)` | opcional | «Animales en adopción». Una consulta no canónica redirige a `listingHref(parseListingQuery(q))`. `generateMetadata` con título y descripción de `messages/es.json`, canónica `/animales`, `robots` según `INDEXING_ENABLED`, sin `og:image`. |
| `/animales/{code}` | `(public)` | opcional | La ficha. `code` fuera de `^[0-9a-hjkmnp-tv-z]{10}$` o sin fila → `notFound()` («no está publicado», 404). Oculto para quien no es el publicador → «no disponible por ahora» (200, `noindex`). |
| `/animales/{code}/imagen?v={version}` | Route Handler, Node | ninguna | La imagen de la vista previa, `image/jpeg` 1200 × 630, menos de 300 KB. Oculto o inexistente → 404. `Cache-Control: no-store`. |
| `/mis-animales` | `(app)` | requerida | Cambia: cada animal suma «Ver ficha» y «Compartir»; aviso si la cuenta no tiene nivel 1. |

### Parámetros de `/animales`

Separados por coma dentro de cada clave. Todo lo que no está en esta tabla se ignora y no vuelve a
aparecer en ninguna dirección que arme el sitio.

| Clave | Valores | Dominio |
|---|---|---|
| `especie` | `perro`, `gato` | `species` `dog`, `cat` |
| `sexo` | `macho`, `hembra` | `sex` |
| `tamano` | `chico`, `mediano`, `grande` | `size` |
| `edad` | `cachorro`, `joven`, `adulto`, `mayor` | `AGE_BANDS` |
| `departamento` | los 19 en slug (`montevideo`, `canelones`, `cerro-largo`, `treinta-y-tres`…) | códigos ISO `UY-*` |
| `castrado` | `si` | `is_neutered = true` |
| `mostrar` | `48`, `72`, … `240` | cuántas mostrar desde el principio |

`listingHref` escribe las claves en ese orden y los valores en el orden de la tabla, así que dos
personas con los mismos filtros comparten la misma dirección.

## Tandas del listado: `GET /api/animales`

Route Handler (`src/app/api/animales/route.ts`), sin sesión requerida, lee con el cliente de quien
pide. Los filtros van con las mismas claves de `/animales` y pasan por `parseListingQuery`, el
único validador.

| Parámetro | Qué es |
|---|---|
| los de `/animales` | los filtros; `mostrar` pide esa cantidad desde el principio (para renovar fotos, R11) |
| `despues` | el cursor `{published_at ISO}~{code}` de la última card cargada; mal formado → se ignora y empieza desde el principio |
| `sumadas` | las opciones que la persona acaba de marcar (`especie.gato,edad.cachorro`), para `listing_filter_used`; no cambia la respuesta |

Respuesta `200 application/json`, `Cache-Control: no-store`:

```text
{
  cards: ListedCardView[],     // ya armadas en el servidor: href, name, ageText, zoneText,
                               // urgentText | null, alt, photo (src, srcSet, placeholder, w, h)
  next: string | null,         // el cursor para el próximo «Ver más», o null si no quedan
  total?: number,              // solo sin `despues`
  totalText?: string           // «37 animales», con el plural ICU, solo sin `despues`
}
```

Una falla de la base responde `503` con `{ error: 'pets.listing.errors.no_response' }`; sin
conexión el pedido no llega y el controlador lo muestra como `pets.listing.errors.offline` (el
mismo criterio de `lib/pets/save-failure.ts`).

## Server Action (`src/actions/share.ts`)

| Acción | Entrada | Salida |
|---|---|---|
| `trackShare` | `'pet' \| 'my_pets'` (validado contra la lista; un valor que no está no registra nada) | `ActionResult<void>`; nunca muestra un error: la medición no frena a nadie |

## Metadatos de la ficha (lo que leen WhatsApp y Facebook)

A la vista:

```text
<title>{nombre} en adopción | {APP_NAME}</title>     (pets.share.title, la misma clave que «Compartir»)
og:title          {nombre} en adopción
og:description    {localidad}, {departamento}
og:image          {APP_URL}/animales/{code}/imagen?v={version}   (1200 × 630, image/jpeg)
og:url            {APP_URL}/animales/{code}
og:type           website
twitter:card      summary_large_image
```

No disponible, inexistente, y el listado:

```text
og:title          {APP_NAME}
og:description    Animales en adopción
(sin og:image)
```

## Compartir

`navigator.share({ title: '{nombre} en adopción', url: '{APP_URL}/animales/{code}' })` o
`navigator.clipboard.writeText('{APP_URL}/animales/{code}')`. Nunca la dirección de la barra.
