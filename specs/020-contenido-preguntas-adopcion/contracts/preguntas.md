# Contrato — Preguntas y respuestas (#8)

Lo que las páginas prometen hacia afuera: a quien las lee, a quien comparte el enlace, a los
buscadores y a la medición.

## `/preguntas` (el índice)

- Responde 200 con o sin sesión. Con una sesión suspendida, redirige a la pantalla de cuenta
  suspendida (`redirectIfSuspended`, FR-007).
- El HTML del servidor trae un solo `h1` («Preguntas y respuestas»), y por grupo, en este orden,
  un `h2` («Si das en adopción», «Si adoptás», «Para todos») con una lista de `a` a
  `/preguntas/<slug>` cuyo texto es la pregunta. Sin páginas publicadas: el vacío «Estamos
  escribiendo esto» con un `a` a `/animales`, y ningún `h2`.
- Metadatos: `title` = «Preguntas y respuestas» (con el sufijo del layout); `description` =
  `questions.index.card`; `canonical` = `/preguntas`; `robots` = `noindex, nofollow` mientras
  `INDEXING_ENABLED` sea `false`; Open Graph y Twitter con `og:title` «Preguntas y respuestas»,
  `og:site_name` = `APP_NAME` y la imagen de la portada (`/imagen?v=<versión>`).

## `/preguntas/<slug>` (cinco)

- `slug ∈ { como-se-verifica, antes-de-entregar, que-exige-uruguay, reconocer-una-estafa,
  compromiso-y-seguimiento }`. Responde 200 con o sin sesión; sesión suspendida → cuenta
  suspendida. Otro `slug` → 404 con «Esta página no está» y un `a` a `/preguntas`.
- El HTML del servidor trae, en este orden: un solo `h1` = la pregunta; el primer párrafo (`p`, de
  1 a 3 oraciones); el detalle (secciones con `h2`); al final, «Actualizada el <día> de <mes> de
  <año>.» en un `time datetime="YYYY-MM-DD"`; «También te puede servir» con dos `a` a otras
  `/preguntas/<slug>`; y una sola acción (`a`):

  | slug | acción | `href` |
  |---|---|---|
  | `como-se-verifica` | «Verificar mi identidad» | `/verificar-identidad` |
  | `antes-de-entregar`, `que-exige-uruguay` | «Publicar un animal» | `/mis-animales/publicar` |
  | `reconocer-una-estafa`, `compromiso-y-seguimiento` | «Ver animales en adopción» | `/animales` |

- `como-se-verifica` contiene, palabra por palabra, los textos de `verification.levels.asks_N`,
  `says_N` (N = 1, 2, 3) y de `identity.request.what_body`, `use_nobody`, `use_deleted`,
  `use_never`, `use_who`, `use_withdraw`, `use_kept`, y un `a` a `/niveles`.
- `que-exige-uruguay`: cada dato legal tiene a su lado un `a` (`rel="noopener"`, en otra pestaña) a
  una URL HTTPS de `OFFICIAL_SOURCE_HOSTS`.
- Ningún `img` lleva información que el texto no diga; el texto se lee sin imágenes y sin
  JavaScript.
- `script type="application/ld+json"` con `BreadcrumbList` (inicio → `/preguntas` → la página) y
  `Article` (`headline`, `dateModified`, `inLanguage: es-UY`).
- Metadatos: `title` = la pregunta; `description` = `questions.<slug>.card` (≤ 160 caracteres);
  `canonical` = `/preguntas/<slug>`; `robots` como el índice; Open Graph y Twitter con la pregunta,
  la descripción, `APP_NAME` y la imagen de la portada. Un `slug` desconocido: solo `title` =
  `APP_NAME`.

## `robots.txt`

- Los lectores de vista previa (`LINK_PREVIEW_AGENTS`) suman `allow: /preguntas`. Para `*` sigue
  `disallow: /` mientras `INDEXING_ENABLED` sea `false`.

## Enlaces nuevos en pantallas que ya existen

- **Pie** (`SiteFooter`, todas las zonas salvo `(suspended)`): un renglón «¿Dudas antes de adoptar
  o de dar en adopción?» con un `a` «Preguntas y respuestas» a `/preguntas`.
- **`/verificar-identidad`**, vista de pedir sin aceptar: un `a` «Cómo se verifica y qué se hace con
  tu cédula» a `/preguntas/como-se-verifica`, debajo de «Qué hacemos con ellas» y antes de «Acepto y
  elijo las fotos». No está después de aceptar ni en las vistas de estado.
- **`/niveles`**: un `a` a `/preguntas/como-se-verifica` entre la escalera y «Volver».

## Eventos de medición

| Evento | Cuándo | Propiedades |
|---|---|---|
| `question_viewed` | Se dibuja `/preguntas/<slug>` para alguien que no es un lector de vista previa | `page`, `origin` (`index` · `levels` · `identity_request` · `question` · `link`) |
| `questions_index_viewed` | Se dibuja `/preguntas` para alguien que no es un lector de vista previa | `origin` (`footer` · `link`) |
| `question_action_used` | Se pide `/verificar-identidad`, `/mis-animales/publicar` o `/animales` con `referer` = una `/preguntas/<slug>` de este mismo host cuya acción es esa pantalla, antes de cualquier puerta | `page` |
